using Microsoft.AspNetCore.Mvc;
using TravlprepTools.API.Scraper.Services;

namespace TravlprepTools.API.Scraper.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ScraperController : ControllerBase
{
    private readonly IScraperService _scraperService;
    private readonly ICollageService _collageService;
    private readonly ILogger<ScraperController> _logger;

    public ScraperController(IScraperService scraperService, ICollageService collageService, ILogger<ScraperController> logger)
    {
        _scraperService = scraperService;
        _collageService = collageService;
        _logger = logger;
    }

    /// <summary>
    /// Scrapes Google.com
    /// </summary>
    /// <returns>Scraped content from Google</returns>
    [HttpGet("google")]
    [ProducesResponseType(typeof(ScraperResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ScrapeGoogle()
    {
        _logger.LogInformation("Scraping Google.com");
        var result = await _scraperService.ScrapeUrlAsync("https://www.google.com");
        
        if (!result.Success)
        {
            return StatusCode(500, result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Scrapes any URL provided as a query parameter
    /// </summary>
    /// <param name="url">The URL to scrape</param>
    /// <returns>Scraped content from the provided URL</returns>
    [HttpGet("url")]
    [ProducesResponseType(typeof(ScraperResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ScrapeUrl([FromQuery] string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return BadRequest(new { error = "URL parameter is required" });
        }

        if (!Uri.TryCreate(url, UriKind.Absolute, out _))
        {
            return BadRequest(new { error = "Invalid URL format" });
        }

        _logger.LogInformation("Scraping URL: {Url}", url);
        var result = await _scraperService.ScrapeUrlAsync(url);
        
        if (!result.Success)
        {
            return StatusCode(500, result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Scrapes a URL provided in the request body
    /// </summary>
    /// <param name="request">Scrape request with URL</param>
    /// <returns>Scraped content from the provided URL</returns>
    [HttpPost("scrape")]
    [ProducesResponseType(typeof(ScraperResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ScrapePost([FromBody] ScrapeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Url))
        {
            return BadRequest(new { error = "URL is required" });
        }

        if (!Uri.TryCreate(request.Url, UriKind.Absolute, out _))
        {
            return BadRequest(new { error = "Invalid URL format" });
        }

        _logger.LogInformation("Scraping URL: {Url}", request.Url);
        var result = await _scraperService.ScrapeUrlAsync(request.Url);
        
        if (!result.Success)
        {
            return StatusCode(500, result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Scrapes Pinterest for high-quality images (1080p+) based on a search query
    /// </summary>
    /// <param name="query">The search query</param>
    /// <param name="count">Number of images to scrape (default: 20, max: 100)</param>
    /// <returns>List of high-quality Pinterest images with dimensions and quality info</returns>
    [HttpGet("pinterest")]
    [ProducesResponseType(typeof(PinterestResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ScrapePinterest([FromQuery] string query, [FromQuery] int count = 20)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(new { error = "Search query is required" });
        }

        if (count <= 0 || count > 100)
        {
            return BadRequest(new { error = "Count must be between 1 and 100" });
        }

        _logger.LogInformation("Scraping Pinterest for query: {Query}, count: {Count}", query, count);
        var result = await _scraperService.ScrapePinterestAsync(query, count);
        
        if (!result.Success)
        {
            return StatusCode(500, result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Scrapes Pinterest for high-quality images (1080p+) via POST request
    /// </summary>
    /// <param name="request">Pinterest search request</param>
    /// <returns>List of high-quality Pinterest images with dimensions and quality info</returns>
    [HttpPost("pinterest")]
    [ProducesResponseType(typeof(PinterestResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ScrapePinterestPost([FromBody] PinterestRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
        {
            return BadRequest(new { error = "Search query is required" });
        }

        var count = request.Count ?? 20;
        if (count <= 0 || count > 100)
        {
            return BadRequest(new { error = "Count must be between 1 and 100" });
        }

        _logger.LogInformation("Scraping Pinterest for query: {Query}, count: {Count}", request.Query, count);
        var result = await _scraperService.ScrapePinterestAsync(request.Query, count);
        
        if (!result.Success)
        {
            return StatusCode(500, result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Scrapes Pinterest for multiple search queries in batch (20 high-quality images per query)
    /// </summary>
    /// <param name="request">Batch Pinterest search request with multiple queries</param>
    /// <returns>Organized results with images for each query</returns>
    [HttpPost("pinterest/batch")]
    [ProducesResponseType(typeof(BatchPinterestResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ScrapePinterestBatch([FromBody] BatchPinterestRequest request)
    {
        var queries = new List<string>();

        // Support both multi-line string and list of queries
        if (!string.IsNullOrWhiteSpace(request.QueriesText))
        {
            // Split by newlines and clean up
            queries = request.QueriesText
                .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(q => q.Trim())
                .Where(q => !string.IsNullOrWhiteSpace(q))
                .ToList();
        }
        else if (request.Queries != null && request.Queries.Count > 0)
        {
            queries = request.Queries;
        }

        if (queries.Count == 0)
        {
            return BadRequest(new { error = "At least one search query is required. Use either 'queriesText' (multi-line string) or 'queries' (array)" });
        }

        if (queries.Count > 50)
        {
            return BadRequest(new { error = "Maximum 50 queries allowed per batch request" });
        }

        // Apply extension to each query if provided
        if (!string.IsNullOrWhiteSpace(request.Extension))
        {
            queries = queries.Select(q => $"{q} {request.Extension}".Trim()).ToList();
            _logger.LogInformation("Applied extension '{Extension}' to all queries", request.Extension);
        }

        var count = request.CountPerQuery ?? 20;
        if (count <= 0 || count > 100)
        {
            return BadRequest(new { error = "CountPerQuery must be between 1 and 100" });
        }

        _logger.LogInformation("Batch scraping Pinterest for {Count} queries", queries.Count);
        var result = await _scraperService.ScrapePinterestBatchAsync(queries, count);
        
        if (!result.Success)
        {
            return StatusCode(500, result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Scrapes Pinterest using plain text list (easiest method - just paste your list!)
    /// </summary>
    /// <param name="extension">Optional text to append to each query (e.g., "arctic finland")</param>
    /// <param name="count">Number of images per query (default: 20, max: 100)</param>
    /// <param name="downloadImages">If true, downloads images locally to avoid access denied errors (default: false)</param>
    /// <returns>Organized results with images for each query</returns>
    [HttpPost("pinterest/batch/text")]
    [Consumes("text/plain")]
    [ProducesResponseType(typeof(BatchPinterestResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ScrapePinterestBatchText(
        [FromBody] string queriesText,
        [FromQuery] string? extension = null,
        [FromQuery] int count = 20,
        [FromQuery] bool downloadImages = false)
    {
        if (string.IsNullOrWhiteSpace(queriesText))
        {
            return BadRequest(new { error = "Request body must contain plain text with one query per line" });
        }

        // Split by newlines and clean up
        var queries = queriesText
            .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(q => q.Trim())
            .Where(q => !string.IsNullOrWhiteSpace(q))
            .ToList();

        if (queries.Count == 0)
        {
            return BadRequest(new { error = "No valid queries found in the text" });
        }

        if (queries.Count > 50)
        {
            return BadRequest(new { error = "Maximum 50 queries allowed per batch request" });
        }

        // Apply extension to each query if provided
        if (!string.IsNullOrWhiteSpace(extension))
        {
            queries = queries.Select(q => $"{q} {extension}".Trim()).ToList();
            _logger.LogInformation("Applied extension '{Extension}' to all queries", extension);
        }

        if (count <= 0 || count > 100)
        {
            return BadRequest(new { error = "Count must be between 1 and 100" });
        }

        _logger.LogInformation("Batch scraping Pinterest for {Count} queries from plain text (Download: {Download})", queries.Count, downloadImages);
        var result = await _scraperService.ScrapePinterestBatchAsync(queries, count, downloadImages);
        
        if (!result.Success)
        {
            return StatusCode(500, result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Creates a 2x2 collage from 4 images in 9:16 aspect ratio
    /// </summary>
    /// <param name="request">Request containing 4 image paths</param>
    /// <returns>Collage image file</returns>
    [HttpPost("collage")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateCollage([FromBody] CollageRequest request)
    {
        if (request.ImagePaths == null || request.ImagePaths.Count != 4)
        {
            return BadRequest(new { error = "Exactly 4 image paths are required to create a collage" });
        }

        try
        {
            _logger.LogInformation("Creating collage from {Count} images", request.ImagePaths.Count);
            
            var collageBytes = await _collageService.CreateCollageAsync(request.ImagePaths);
            
            var fileName = $"collage_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}.jpg";
            return File(collageBytes, "image/jpeg", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating collage");
            return StatusCode(500, new { error = "Failed to create collage", details = ex.Message });
        }
    }
}

/// <summary>
/// Request model for scraping a URL
/// </summary>
public record ScrapeRequest
{
    /// <summary>
    /// The URL to scrape
    /// </summary>
    public string Url { get; init; } = string.Empty;
}

/// <summary>
/// Request model for Pinterest search
/// </summary>
public record PinterestRequest
{
    /// <summary>
    /// The search query
    /// </summary>
    public string Query { get; init; } = string.Empty;
    
    /// <summary>
    /// Number of images to scrape (default: 20, max: 100)
    /// </summary>
    public int? Count { get; init; } = 20;
}

/// <summary>
/// Request model for batch Pinterest search
/// </summary>
public record BatchPinterestRequest
{
    /// <summary>
    /// Multi-line string of search queries (one per line). Easier for pasting lists.
    /// Example: "Snow mobile safari\nSanta Claus village\nGlass igloo hotel"
    /// </summary>
    public string? QueriesText { get; init; }
    
    /// <summary>
    /// Alternative: List of search queries to process (use either this OR QueriesText)
    /// </summary>
    public List<string>? Queries { get; init; }
    
    /// <summary>
    /// Optional extension to append to each query (e.g., "arctic finland", "winter", etc.)
    /// </summary>
    public string? Extension { get; init; }
    
    /// <summary>
    /// Number of images to scrape per query (default: 20, max: 100)
    /// </summary>
    public int? CountPerQuery { get; init; } = 20;
}

public record CollageRequest
{
    /// <summary>
    /// List of 4 image URLs or paths to create a collage
    /// </summary>
    public List<string> ImagePaths { get; init; } = new();
}

