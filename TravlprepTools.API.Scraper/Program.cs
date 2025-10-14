using TravlprepTools.API.Scraper.Services;
using TravlprepTools.API.Scraper.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
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

// Clean up any orphaned browser processes from previous runs
try
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("Cleaning up any orphaned browser processes from previous runs...");
    
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
    logger.LogWarning(ex, "Could not kill orphaned browser processes (they may not exist)");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Scraper API V1");
        options.RoutePrefix = string.Empty; // Set Swagger UI at app root
    });
}

// Serve static files from downloaded_images folder
var imageDownloadPath = builder.Configuration["ImageDownloadPath"] ?? "downloaded_images";
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), imageDownloadPath)),
    RequestPath = "/images"
});

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
