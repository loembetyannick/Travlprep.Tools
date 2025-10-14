namespace TravlprepTools.API.Scraper.Services;

public interface IScraperService
{
    Task<ScraperResult> ScrapeUrlAsync(string url);
    Task<PinterestResult> ScrapePinterestAsync(string searchQuery, int imageCount = 20, bool downloadImages = false);
    Task<BatchPinterestResult> ScrapePinterestBatchAsync(List<string> searchQueries, int imageCountPerQuery = 20, bool downloadImages = false);
}

