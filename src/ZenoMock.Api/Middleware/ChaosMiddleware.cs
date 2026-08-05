using System.Text;
using ZenoMock.Api.Services.Chaos;

namespace ZenoMock.Api.Middleware;

public sealed class ChaosMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ChaosConfigStore store)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (!ShouldApply(path))
        {
            await next(context);
            return;
        }

        var config = store.Snapshot();

        if (config.LatencyMs > 0)
        {
            await Task.Delay(config.LatencyMs, context.RequestAborted);
        }

        // 500 short-circuits the pipeline — corrupt JSON never runs on that request.
        if (ChaosChance.ShouldInject(config.Error500Percent))
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "chaos-injected-500",
                chaos = true,
                message = "Injected by ZenoMock chaos middleware."
            });
            return;
        }

        if (!ChaosChance.ShouldInject(config.CorruptedJsonPercent))
        {
            await next(context);
            return;
        }

        var originalBody = context.Response.Body;
        await using var buffer = new MemoryStream();
        context.Response.Body = buffer;

        try
        {
            await next(context);

            buffer.Seek(0, SeekOrigin.Begin);
            var shouldCorrupt =
                context.Response.StatusCode is >= 200 and < 300
                && IsJsonContentType(context.Response.ContentType);

            if (!shouldCorrupt)
            {
                context.Response.Body = originalBody;
                await buffer.CopyToAsync(originalBody, context.RequestAborted);
                return;
            }

            using var reader = new StreamReader(buffer, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
            var payload = await reader.ReadToEndAsync(context.RequestAborted);
            var corrupted = CorruptJson(payload);

            context.Response.Body = originalBody;
            context.Response.Headers.Remove("Content-Length");
            context.Response.ContentType = "application/json; charset=utf-8";
            await context.Response.WriteAsync(corrupted, context.RequestAborted);
        }
        finally
        {
            context.Response.Body = originalBody;
        }
    }

    private static bool ShouldApply(string path)
    {
        if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
        {
            // Keep chaos + proxy config reachable.
            if (path.StartsWith("/api/v1/chaos", StringComparison.OrdinalIgnoreCase)
                || path.StartsWith("/api/v1/proxy", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            return true;
        }

        return path.StartsWith("/proxy", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsJsonContentType(string? contentType) =>
        !string.IsNullOrWhiteSpace(contentType)
        && contentType.Contains("json", StringComparison.OrdinalIgnoreCase);

    private static string CorruptJson(string payload)
    {
        if (string.IsNullOrWhiteSpace(payload))
        {
            return "{";
        }

        return Random.Shared.Next(0, 4) switch
        {
            0 => payload.TrimEnd().TrimEnd('}') + ",\"chaos\":true",
            1 => payload.Replace("\"", "'", StringComparison.Ordinal),
            2 => payload[..Math.Max(1, payload.Length / 2)],
            _ => "{\"chaos\":true,\"corrupted\":true"
        };
    }
}
