using Microsoft.AspNetCore.Mvc.Formatters;
using System.Text;

namespace TravlprepTools.API.Scraper.Infrastructure;

public class TextPlainInputFormatter : InputFormatter
{
    public TextPlainInputFormatter()
    {
        SupportedMediaTypes.Add("text/plain");
    }

    public override async Task<InputFormatterResult> ReadRequestBodyAsync(InputFormatterContext context)
    {
        var request = context.HttpContext.Request;
        using var reader = new StreamReader(request.Body, Encoding.UTF8);
        var content = await reader.ReadToEndAsync();
        return await InputFormatterResult.SuccessAsync(content);
    }

    public override bool CanRead(InputFormatterContext context)
    {
        var contentType = context.HttpContext.Request.ContentType;
        return contentType != null && contentType.StartsWith("text/plain");
    }
}

