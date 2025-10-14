namespace TravlprepTools.API.Scraper.Services;

public record ScraperResult
{
    public string Url { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public int ContentLength { get; init; }
    public bool Success { get; init; }
    public string? Error { get; init; }
    public DateTime ScrapedAt { get; init; }
}

