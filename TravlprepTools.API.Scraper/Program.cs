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

app.Run();
