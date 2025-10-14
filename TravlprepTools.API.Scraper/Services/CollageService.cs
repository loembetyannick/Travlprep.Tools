using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.PixelFormats;

namespace TravlprepTools.API.Scraper.Services;

public interface ICollageService
{
    Task<byte[]> CreateCollageAsync(List<string> imagePaths);
}

public class CollageService : ICollageService
{
    private readonly ILogger<CollageService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _imageDownloadPath;

    public CollageService(ILogger<CollageService> logger, IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _imageDownloadPath = configuration["ImageDownloadPath"] ?? "downloaded_images";
    }

    public async Task<byte[]> CreateCollageAsync(List<string> imagePaths)
    {
        if (imagePaths == null || imagePaths.Count != 4)
        {
            throw new ArgumentException("Exactly 4 image paths are required for collage generation");
        }

        _logger.LogInformation("Creating collage from {Count} images", imagePaths.Count);

        // Calculate dimensions for 9:16 aspect ratio (portrait)
        // We'll use 1080x1920 as the base (Full HD vertical)
        const int collageWidth = 1080;
        const int collageHeight = 1920;
        const int cellWidth = collageWidth / 2;
        const int cellHeight = collageHeight / 2;

        // Create the collage canvas
        using var collage = new Image<Rgba32>(collageWidth, collageHeight);

        // Load and place each image in a 2x2 grid
        var positions = new[]
        {
            new { X = 0, Y = 0 },              // Top-left
            new { X = cellWidth, Y = 0 },      // Top-right
            new { X = 0, Y = cellHeight },     // Bottom-left
            new { X = cellWidth, Y = cellHeight } // Bottom-right
        };

        var httpClient = _httpClientFactory.CreateClient();
        httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        httpClient.DefaultRequestHeaders.Referrer = new Uri("https://www.pinterest.com/");

        for (int i = 0; i < imagePaths.Count; i++)
        {
            var imagePath = imagePaths[i];
            
            try
            {
                Image sourceImage;

                // Check if it's a URL (Pinterest image)
                if (imagePath.StartsWith("http://") || imagePath.StartsWith("https://"))
                {
                    _logger.LogInformation("Downloading image from URL: {Url}", imagePath);
                    var imageBytes = await httpClient.GetByteArrayAsync(imagePath);
                    sourceImage = await Image.LoadAsync(new MemoryStream(imageBytes));
                }
                // Check if it's a local API path
                else if (imagePath.StartsWith("/images/"))
                {
                    var localPath = Path.Combine(_imageDownloadPath, Path.GetFileName(imagePath));
                    var fullPath = Path.IsPathRooted(localPath) 
                        ? localPath 
                        : Path.Combine(Directory.GetCurrentDirectory(), localPath);

                    if (!File.Exists(fullPath))
                    {
                        _logger.LogWarning("Local image not found: {Path}", fullPath);
                        continue;
                    }

                    sourceImage = await Image.LoadAsync(fullPath);
                }
                // Treat as local file path
                else
                {
                    var fullPath = Path.IsPathRooted(imagePath) 
                        ? imagePath 
                        : Path.Combine(Directory.GetCurrentDirectory(), imagePath);

                    if (!File.Exists(fullPath))
                    {
                        _logger.LogWarning("Image file not found: {Path}", fullPath);
                        continue;
                    }

                    sourceImage = await Image.LoadAsync(fullPath);
                }

                // Resize the image to fit the cell while maintaining aspect ratio
                sourceImage.Mutate(x => x.Resize(new ResizeOptions
                {
                    Size = new Size(cellWidth, cellHeight),
                    Mode = ResizeMode.Crop,
                    Position = AnchorPositionMode.Center
                }));

                // Draw the image onto the collage at the appropriate position
                collage.Mutate(ctx => ctx.DrawImage(sourceImage, new Point(positions[i].X, positions[i].Y), 1f));
                
                sourceImage.Dispose();
                
                _logger.LogInformation("Added image {Index} to collage", i + 1);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing image {Path}", imagePath);
            }
        }

        // Convert to byte array
        using var ms = new MemoryStream();
        await collage.SaveAsJpegAsync(ms);
        
        _logger.LogInformation("Collage created successfully, size: {Size} bytes", ms.Length);
        
        return ms.ToArray();
    }
}

