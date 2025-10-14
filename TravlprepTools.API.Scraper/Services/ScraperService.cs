using PuppeteerSharp;
using System.Collections.Concurrent;

namespace TravlprepTools.API.Scraper.Services;

public class ScraperService : IScraperService, IDisposable
{
    private static bool _browserDownloaded = false;
    private static readonly SemaphoreSlim _downloadLock = new(1, 1);
    private readonly ILogger<ScraperService> _logger;
    private readonly IImageDownloadService _imageDownloadService;
    private readonly ConcurrentBag<IBrowser> _activeBrowsers = new();
    private bool _disposed = false;

    public ScraperService(ILogger<ScraperService> logger, IImageDownloadService imageDownloadService)
    {
        _logger = logger;
        _imageDownloadService = imageDownloadService;
    }

    public async Task<ScraperResult> ScrapeUrlAsync(string url)
    {
        try
        {
            // Ensure browser is downloaded (only once)
            if (!_browserDownloaded)
            {
                await _downloadLock.WaitAsync();
                try
                {
                    if (!_browserDownloaded)
                    {
                        _logger.LogInformation("Downloading Chromium browser...");
                        var browserFetcher = new BrowserFetcher();
                        await browserFetcher.DownloadAsync();
                        _browserDownloaded = true;
                        _logger.LogInformation("Chromium browser downloaded successfully");
                    }
                }
                finally
                {
                    _downloadLock.Release();
                }
            }

            _logger.LogInformation("Launching browser for URL: {Url}", url);

            var browser = await Puppeteer.LaunchAsync(new LaunchOptions
            {
                Headless = true,
                Args = new[] { "--no-sandbox", "--disable-setuid-sandbox" }
            });

            _activeBrowsers.Add(browser);

            try
            {
                await using var page = await browser.NewPageAsync();
            
            await page.GoToAsync(url, new NavigationOptions
            {
                WaitUntil = new[] { WaitUntilNavigation.Networkidle0 },
                Timeout = 30000
            });

                var title = await page.GetTitleAsync();
                var content = await page.GetContentAsync();

                _logger.LogInformation("Successfully scraped {Url}", url);

                return new ScraperResult
                {
                    Url = page.Url,
                    Title = title,
                    Content = content,
                    ContentLength = content.Length,
                    Success = true,
                    ScrapedAt = DateTime.UtcNow
                };
            }
            finally
            {
                await browser.DisposeAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scraping URL: {Url}", url);
            return new ScraperResult
            {
                Url = url,
                Success = false,
                Error = ex.Message
            };
        }
    }

    public async Task<PinterestResult> ScrapePinterestAsync(string searchQuery, int imageCount = 20, bool downloadImages = false)
    {
        try
        {
            // Ensure browser is downloaded (only once)
            if (!_browserDownloaded)
            {
                await _downloadLock.WaitAsync();
                try
                {
                    if (!_browserDownloaded)
                    {
                        _logger.LogInformation("Downloading Chromium browser...");
                        var browserFetcher = new BrowserFetcher();
                        await browserFetcher.DownloadAsync();
                        _browserDownloaded = true;
                        _logger.LogInformation("Chromium browser downloaded successfully");
                    }
                }
                finally
                {
                    _downloadLock.Release();
                }
            }

            _logger.LogInformation("Scraping Pinterest for query: {Query}", searchQuery);

            var browser = await Puppeteer.LaunchAsync(new LaunchOptions
            {
                Headless = true,
                Args = new[] 
                { 
                    "--no-sandbox", 
                    "--disable-setuid-sandbox",
                    "--disable-blink-features=AutomationControlled"
                }
            });

            _activeBrowsers.Add(browser);

            try
            {
                await using var page = await browser.NewPageAsync();
            
            // Set user agent to avoid detection
            await page.SetUserAgentAsync("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            
            // Set viewport
            await page.SetViewportAsync(new ViewPortOptions
            {
                Width = 1920,
                Height = 1080
            });

            // Navigate to Pinterest search
            var searchUrl = $"https://www.pinterest.com/search/pins/?q={Uri.EscapeDataString(searchQuery)}";
            await page.GoToAsync(searchUrl, new NavigationOptions
            {
                WaitUntil = new[] { WaitUntilNavigation.Networkidle0 },
                Timeout = 60000
            });

            _logger.LogInformation("Page loaded, waiting for images...");

            // Wait for initial images to load
            await page.WaitForSelectorAsync("img", new WaitForSelectorOptions { Timeout = 30000 });
            
            // Give it a moment to load
            await Task.Delay(3000);

            var images = new List<PinterestImage>();
            var scrollAttempts = 0;
            // Dynamically set scroll attempts based on image count needed
            // More images = more scrolls (roughly 3-5 new images per scroll)
            var maxScrollAttempts = Math.Max(20, (imageCount / 3) + 5);

            while (images.Count < imageCount * 2 && scrollAttempts < maxScrollAttempts) // Collect 2x images to have more to choose from
            {
                // Extract image data with higher quality URLs
                var imageData = await page.EvaluateFunctionAsync<List<Dictionary<string, string>>>(@"
                    () => {
                        const images = [];
                        const imgElements = document.querySelectorAll('img[src*=""pinimg""]');
                        
                        imgElements.forEach(img => {
                            if (img.src && img.src.includes('pinimg')) {
                                const parent = img.closest('a');
                                const altText = img.alt || '';
                                
                                // Convert to high-resolution URL
                                // Pinterest uses various size suffixes: 236x, 474x, 736x, originals
                                let highResUrl = img.src;
                                
                                // Replace size parameters to get high quality version
                                // Try to get 1200x version or originals
                                if (highResUrl.includes('/236x/')) {
                                    highResUrl = highResUrl.replace('/236x/', '/originals/');
                                } else if (highResUrl.includes('/474x/')) {
                                    highResUrl = highResUrl.replace('/474x/', '/originals/');
                                } else if (highResUrl.includes('/736x/')) {
                                    highResUrl = highResUrl.replace('/736x/', '/originals/');
                                }
                                
                                // Get dimensions if available
                                const width = img.naturalWidth || 0;
                                const height = img.naturalHeight || 0;
                                
                                images.push({
                                    imageUrl: highResUrl,
                                    title: altText,
                                    sourceUrl: parent ? parent.href : '',
                                    width: width.toString(),
                                    height: height.toString()
                                });
                            }
                        });
                        
                        return images;
                    }
                ");

                _logger.LogInformation("Found {Count} images so far", imageData?.Count ?? 0);

                if (imageData != null)
                {
                    foreach (var data in imageData)
                    {
                        var imageUrl = data.TryGetValue("imageUrl", out var url) ? url : "";
                        
                        // Skip if we already have this image or it's empty
                        if (string.IsNullOrEmpty(imageUrl) || images.Any(i => i.ImageUrl == imageUrl))
                            continue;

                        // Get dimensions
                        var width = data.TryGetValue("width", out var widthStr) && int.TryParse(widthStr, out var w) ? w : 0;
                        var height = data.TryGetValue("height", out var heightStr) && int.TryParse(heightStr, out var h) ? h : 0;

                        // Determine quality based on URL and dimensions
                        var quality = "Unknown";
                        if (imageUrl.Contains("/originals/"))
                        {
                            quality = "Original (Highest Quality)";
                        }
                        else if (imageUrl.Contains("/736x/"))
                        {
                            quality = "High (736px)";
                        }
                        else if (imageUrl.Contains("/474x/"))
                        {
                            quality = "Medium (474px)";
                        }
                        else if (imageUrl.Contains("/236x/"))
                        {
                            quality = "Low (236px)";
                        }

                        // Accept medium quality and above (474px+) or unknown dimensions
                        // This ensures we get enough images while maintaining decent quality
                        var isAcceptableQuality = width >= 474 || width == 0 || imageUrl.Contains("/originals/") || imageUrl.Contains("/736x/");
                        
                        if (!isAcceptableQuality)
                        {
                            _logger.LogDebug("Skipping low quality image: {Width}x{Height}", width, height);
                            continue;
                        }

                        images.Add(new PinterestImage
                        {
                            ImageUrl = imageUrl,
                            Title = data.TryGetValue("title", out var title) ? title : "",
                            SourceUrl = data.TryGetValue("sourceUrl", out var sourceUrl) ? sourceUrl : null,
                            Width = width,
                            Height = height,
                            Quality = quality
                        });
                    }
                }

                // Scroll down to load more images (don't break early, let the while condition handle it)
                await page.EvaluateFunctionAsync("() => window.scrollBy(0, window.innerHeight)");
                await Task.Delay(1500); // Slightly faster scrolling
                scrollAttempts++;
            }

            _logger.LogInformation("Successfully scraped {Count} images from Pinterest", images.Count);

            // Sort images by quality: prioritize originals, then by resolution
            var sortedImages = images
                .OrderByDescending(img => img.ImageUrl.Contains("/originals/") ? 2 : 0)
                .ThenByDescending(img => img.Width * img.Height) // Sort by total pixel count
                .ThenByDescending(img => Math.Min(img.Width, img.Height)) // Then by smallest dimension
                .ToList();

            var finalImages = sortedImages.Take(imageCount).ToList();
            _logger.LogInformation("Selected top {Count} highest quality images", finalImages.Count);

                // Download images if requested
                if (downloadImages)
                {
                    _logger.LogInformation("Downloading {Count} images locally...", finalImages.Count);
                    
                    for (int i = 0; i < finalImages.Count; i++)
                    {
                        var image = finalImages[i];
                        var localPath = await _imageDownloadService.DownloadImageAsync(image.ImageUrl, searchQuery, i + 1);
                        
                        // Convert file path to URL path for serving through API
                        string? localUrl = null;
                        if (localPath != null)
                        {
                            var fileName = Path.GetFileName(localPath);
                            localUrl = $"/images/{fileName}";
                        }
                        
                        // Update the image with local file path and use local URL as the main image URL
                        finalImages[i] = image with 
                        { 
                            ImageUrl = localUrl ?? image.ImageUrl, // Use local URL if available
                            LocalFilePath = localPath,
                            Downloaded = localPath != null
                        };
                    }
                    
                    _logger.LogInformation("Downloaded {Count} images successfully", finalImages.Count(i => i.Downloaded));
                }

                return new PinterestResult
                {
                    SearchQuery = searchQuery,
                    Images = finalImages,
                    ImageCount = finalImages.Count,
                    Success = true,
                    ScrapedAt = DateTime.UtcNow
                };
            }
            finally
            {
                await browser.DisposeAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scraping Pinterest for query: {Query}", searchQuery);
            return new PinterestResult
            {
                SearchQuery = searchQuery,
                Success = false,
                Error = ex.Message,
                ScrapedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<BatchPinterestResult> ScrapePinterestBatchAsync(List<string> searchQueries, int imageCountPerQuery = 20, bool downloadImages = false)
    {
        try
        {
            _logger.LogInformation("Starting PARALLEL batch Pinterest scraping for {Count} queries", searchQueries.Count);

            // Create tasks for all queries to run in parallel
            var scrapingTasks = searchQueries.Select(async (query, index) =>
            {
                try
                {
                    _logger.LogInformation("Starting query {Index}/{Total}: {Query}", 
                        index + 1, searchQueries.Count, query);

                    var result = await ScrapePinterestAsync(query, imageCountPerQuery, downloadImages);

                    _logger.LogInformation("Completed query {Index}/{Total}: {Query} - {Count} images", 
                        index + 1, searchQueries.Count, query, result.Images.Count);

                    return new QueryResult
                    {
                        Query = query,
                        Images = result.Images,
                        ImageCount = result.Images.Count,
                        Success = result.Success,
                        Error = result.Error
                    };
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error scraping Pinterest for query: {Query}", query);
                    return new QueryResult
                    {
                        Query = query,
                        Images = new List<PinterestImage>(),
                        ImageCount = 0,
                        Success = false,
                        Error = ex.Message
                    };
                }
            }).ToList();

            // Wait for all scraping tasks to complete in parallel
            var results = await Task.WhenAll(scrapingTasks);
            var totalImages = results.Sum(r => r.ImageCount);

            _logger.LogInformation("Batch scraping completed. Total images: {Total}", totalImages);

            return new BatchPinterestResult
            {
                Results = results.ToList(),
                TotalQueries = searchQueries.Count,
                TotalImages = totalImages,
                Success = true,
                ScrapedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in batch Pinterest scraping");
            return new BatchPinterestResult
            {
                Success = false,
                Error = ex.Message,
                ScrapedAt = DateTime.UtcNow
            };
        }
    }

    public void Dispose()
    {
        if (_disposed)
            return;

        _logger.LogInformation("Disposing ScraperService and cleaning up {Count} active browser sessions", _activeBrowsers.Count);

        // Clean up all active browsers
        foreach (var browser in _activeBrowsers)
        {
            try
            {
                if (!browser.IsClosed)
                {
                    browser.CloseAsync().GetAwaiter().GetResult();
                }
                browser.Dispose();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error disposing browser instance");
            }
        }

        _activeBrowsers.Clear();
        _disposed = true;

        _logger.LogInformation("ScraperService disposed successfully");
    }
}

