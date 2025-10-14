namespace TravlprepTools.API.Scraper.Services;

public record BatchPinterestResult
{
    public List<QueryResult> Results { get; init; } = new();
    public int TotalQueries { get; init; }
    public int TotalImages { get; init; }
    public bool Success { get; init; }
    public string? Error { get; init; }
    public DateTime ScrapedAt { get; init; }
}

public record QueryResult
{
    public string Query { get; init; } = string.Empty;
    public List<PinterestImage> Images { get; init; } = new();
    public int ImageCount { get; init; }
    public bool Success { get; init; }
    public string? Error { get; init; }
}

