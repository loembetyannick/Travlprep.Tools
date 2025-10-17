using TravlprepTools.API.Scraper.Services;
using TravlprepTools.API.Scraper.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000", 
                "http://localhost:3001",
                "https://*.railway.app",
                "https://*.up.railway.app",
                "https://travlprep-tools.vercel.app")
              .SetIsOriginAllowedToAllowWildcardSubdomains()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add services to the container.
builder.Services.AddControllers(options =>
{
    options.InputFormatters.Insert(0, new TextPlainInputFormatter());
});

// Add Swagger/OpenAPI services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "TravlprepTools Scraper API",
        Version = "v1",
        Description = "A web scraping API using PuppeteerSharp"
    });
});

// Register HTTP client factory for image downloads
builder.Services.AddHttpClient();

// Register services
builder.Services.AddSingleton<IImageDownloadService, ImageDownloadService>();
builder.Services.AddSingleton<IScraperService, ScraperService>();
builder.Services.AddScoped<ICollageService, CollageService>();

var app = builder.Build();

// Clean up any orphaned processes from previous runs
try
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("Cleaning up any orphaned processes from previous runs...");
    
    // Kill any process using port 5228
    try
    {
        var lsofProcess = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = "/bin/sh",
            Arguments = "-c \"lsof -ti :5228\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        });
        
        if (lsofProcess != null)
        {
            lsofProcess.WaitForExit(2000);
            var output = lsofProcess.StandardOutput.ReadToEnd().Trim();
            
            if (!string.IsNullOrEmpty(output))
            {
                var pids = output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                foreach (var pid in pids)
                {
                    logger.LogInformation($"Killing process {pid} using port 5228...");
                    var killProcess = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = "kill",
                        Arguments = $"-9 {pid}",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    });
                    killProcess?.WaitForExit(1000);
                }
                logger.LogInformation("Killed processes using port 5228");
            }
        }
    }
    catch (Exception portEx)
    {
        logger.LogWarning(portEx, "Could not kill process on port 5228 (it may not exist)");
    }
    
    // Kill any orphaned browser processes
    var killChrome = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
    {
        FileName = "pkill",
        Arguments = "-f \"(chrome|chromium)\"",
        RedirectStandardOutput = true,
        RedirectStandardError = true,
        UseShellExecute = false,
        CreateNoWindow = true
    });
    killChrome?.WaitForExit(2000);
    
    logger.LogInformation("Startup cleanup completed");
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogWarning(ex, "Could not complete startup cleanup");
}

// Configure the HTTP request pipeline.
// Enable Swagger in all environments for Railway deployment
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Scraper API V1");
    options.RoutePrefix = string.Empty; // Set Swagger UI at app root
});

// Note: Static file serving for images is disabled since we're not downloading images by default
// If image downloading is re-enabled, uncomment the lines below:
//
// var imageDownloadPath = builder.Configuration["ImageDownloadPath"] ?? "downloaded_images";
// var fullImagePath = Path.Combine(Directory.GetCurrentDirectory(), imageDownloadPath);
// if (!Directory.Exists(fullImagePath))
// {
//     Directory.CreateDirectory(fullImagePath);
// }
// app.UseStaticFiles(new StaticFileOptions
// {
//     FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(fullImagePath),
//     RequestPath = "/images"
// });

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

// Register cleanup on application shutdown
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStopping.Register(() =>
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("Application is stopping - cleaning up resources...");
    
    try
    {
        // Kill any Chrome/Chromium processes that might be orphaned
        var killChrome = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = "pkill",
            Arguments = "-f \"(chrome|chromium)\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        });
        killChrome?.WaitForExit(2000);
        
        logger.LogInformation("Killed orphaned browser processes");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Failed to kill browser processes during shutdown");
    }
    
    logger.LogInformation("Cleanup completed");
});

app.Run();
