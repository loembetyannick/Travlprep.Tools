namespace TravlprepTools.API.Scraper.Services;

public record PinterestResult
{
    public string SearchQuery { get; init; } = string.Empty;
    public List<PinterestImage> Images { get; init; } = new();
    public int ImageCount { get; init; }
    public bool Success { get; init; }
    public string? Error { get; init; }
    public DateTime ScrapedAt { get; init; }
}

public record PinterestImage
{
    public string ImageUrl { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? SourceUrl { get; init; }
    public int Width { get; init; }
    public int Height { get; init; }
    public string Quality { get; init; } = string.Empty;
    public string? LocalFilePath { get; init; }
    public bool Downloaded { get; init; }
}

