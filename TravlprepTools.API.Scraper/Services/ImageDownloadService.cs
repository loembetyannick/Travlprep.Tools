namespace TravlprepTools.API.Scraper.Services;

public interface IImageDownloadService
{
    Task<string?> DownloadImageAsync(string imageUrl, string query, int index);
}

public class ImageDownloadService : IImageDownloadService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ImageDownloadService> _logger;
    private readonly string _downloadPath;

    public ImageDownloadService(IHttpClientFactory httpClientFactory, ILogger<ImageDownloadService> logger, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        
        // Get download path from config or use default
        _downloadPath = configuration["ImageDownloadPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "downloaded_images");
        
        // Create directory if it doesn't exist
        if (!Directory.Exists(_downloadPath))
        {
            Directory.CreateDirectory(_downloadPath);
            _logger.LogInformation("Created image download directory: {Path}", _downloadPath);
        }
    }

    public async Task<string?> DownloadImageAsync(string imageUrl, string query, int index)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            
            // Add headers to mimic a browser request
            client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            client.DefaultRequestHeaders.Add("Referer", "https://www.pinterest.com/");
            client.DefaultRequestHeaders.Add("Accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8");

            // Download the image
            var response = await client.GetAsync(imageUrl);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to download image from {Url}: {Status}", imageUrl, response.StatusCode);
                return null;
            }

            var imageBytes = await response.Content.ReadAsByteArrayAsync();
            
            // Determine file extension from content type or URL
            var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";
            var extension = contentType switch
            {
                "image/jpeg" => ".jpg",
                "image/png" => ".png",
                "image/gif" => ".gif",
                "image/webp" => ".webp",
                _ => ".jpg"
            };

            // Create safe filename from query
            var safeQuery = string.Join("_", query.Split(Path.GetInvalidFileNameChars()));
            safeQuery = safeQuery.Length > 50 ? safeQuery.Substring(0, 50) : safeQuery;
            
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var fileName = $"{safeQuery}_{index}_{timestamp}{extension}";
            var filePath = Path.Combine(_downloadPath, fileName);

            // Save the image
            await File.WriteAllBytesAsync(filePath, imageBytes);
            
            _logger.LogInformation("Downloaded image to: {Path}", filePath);
            
            return filePath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading image from {Url}", imageUrl);
            return null;
        }
    }
}

