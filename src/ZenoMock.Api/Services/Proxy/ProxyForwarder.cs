using System.Net.Http.Headers;
using Microsoft.Extensions.Options;

namespace ZenoMock.Api.Services.Proxy;

public sealed class ProxyForwarder(
    IHttpClientFactory httpClientFactory,
    IOptions<ProxyOptions> options)
{
    public const string HttpClientName = "zenomock-proxy";

    private static readonly HashSet<string> HopByHopHeaders = new(StringComparer.OrdinalIgnoreCase)
    {
        "Connection",
        "Keep-Alive",
        "Proxy-Authenticate",
        "Proxy-Authorization",
        "TE",
        "Trailer",
        "Transfer-Encoding",
        "Upgrade",
        "Host",
        "Content-Length"
    };

    private readonly ProxyOptions _options = options.Value;

    public async Task ForwardAsync(HttpContext context, Uri target, CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient(HttpClientName);
        using var upstreamRequest = new HttpRequestMessage(
            new HttpMethod(context.Request.Method),
            target);

        foreach (var header in context.Request.Headers)
        {
            if (HopByHopHeaders.Contains(header.Key))
            {
                continue;
            }

            if (!upstreamRequest.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray()))
            {
                // content headers applied after body is attached
            }
        }

        if (HasBody(context.Request.Method))
        {
            if (context.Request.ContentLength is > 0
                && context.Request.ContentLength > _options.MaxRequestBodyBytes)
            {
                context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "request-body-too-large",
                    maxRequestBodyBytes = _options.MaxRequestBodyBytes
                }, cancellationToken);
                return;
            }

            await using var limited = new MemoryStream();
            var chunk = new byte[8192];
            long total = 0;
            while (true)
            {
                var read = await context.Request.Body.ReadAsync(chunk.AsMemory(0, chunk.Length), cancellationToken);
                if (read == 0)
                {
                    break;
                }

                total += read;
                if (total > _options.MaxRequestBodyBytes)
                {
                    context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        error = "request-body-too-large",
                        maxRequestBodyBytes = _options.MaxRequestBodyBytes
                    }, cancellationToken);
                    return;
                }

                await limited.WriteAsync(chunk.AsMemory(0, read), cancellationToken);
            }

            var bytes = limited.ToArray();
            var content = new ByteArrayContent(bytes);
            if (MediaTypeHeaderValue.TryParse(context.Request.ContentType, out var mediaType))
            {
                content.Headers.ContentType = mediaType;
            }

            foreach (var header in context.Request.Headers)
            {
                if (HopByHopHeaders.Contains(header.Key))
                {
                    continue;
                }

                content.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
            }

            upstreamRequest.Content = content;
        }

        using var upstreamResponse = await client.SendAsync(
            upstreamRequest,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);

        context.Response.StatusCode = (int)upstreamResponse.StatusCode;
        context.Response.Headers["X-ZenoMock-Proxy"] = "1";
        context.Response.Headers["X-ZenoMock-Upstream"] = target.GetLeftPart(UriPartial.Path);

        foreach (var header in upstreamResponse.Headers)
        {
            if (HopByHopHeaders.Contains(header.Key))
            {
                continue;
            }

            context.Response.Headers[header.Key] = header.Value.ToArray();
        }

        foreach (var header in upstreamResponse.Content.Headers)
        {
            if (HopByHopHeaders.Contains(header.Key))
            {
                continue;
            }

            context.Response.Headers[header.Key] = header.Value.ToArray();
        }

        await using var responseStream = await upstreamResponse.Content.ReadAsStreamAsync(cancellationToken);
        await using var buffer = new MemoryStream();
        var copied = await CopyLimitedAsync(
            responseStream,
            buffer,
            _options.MaxResponseBodyBytes,
            cancellationToken);

        if (!copied)
        {
            context.Response.StatusCode = StatusCodes.Status502BadGateway;
            context.Response.ContentType = "application/json";
            context.Response.Headers.Remove("Content-Length");
            await context.Response.WriteAsJsonAsync(new
            {
                error = "upstream-response-too-large",
                maxResponseBodyBytes = _options.MaxResponseBodyBytes
            }, cancellationToken);
            return;
        }

        context.Response.Headers.Remove("Content-Length");
        buffer.Position = 0;
        await buffer.CopyToAsync(context.Response.Body, cancellationToken);
    }

    private static bool HasBody(string method) =>
        HttpMethods.IsPost(method)
        || HttpMethods.IsPut(method)
        || HttpMethods.IsPatch(method);

    private static async Task<bool> CopyLimitedAsync(
        Stream source,
        Stream destination,
        int maxBytes,
        CancellationToken cancellationToken)
    {
        var buffer = new byte[8192];
        var total = 0;
        while (true)
        {
            var read = await source.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken);
            if (read == 0)
            {
                return true;
            }

            total += read;
            if (total > maxBytes)
            {
                return false;
            }

            await destination.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
        }
    }
}
