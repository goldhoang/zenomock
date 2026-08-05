using ZenoMock.Api.Services.Proxy;

namespace ZenoMock.Api.Endpoints;

public static class ProxyEndpoints
{
    public static IEndpointRouteBuilder MapProxyEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/proxy/config", (ProxyTargetBuilder builder) =>
            {
                var options = builder.Options;
                return Results.Ok(new
                {
                    endpoint = "GET /api/v1/proxy/config",
                    enabled = options.Enabled,
                    upstreamBaseUrl = options.UpstreamBaseUrl,
                    allowedHosts = options.AllowedHosts,
                    timeoutSeconds = options.TimeoutSeconds,
                    maxRequestBodyBytes = options.MaxRequestBodyBytes,
                    maxResponseBodyBytes = options.MaxResponseBodyBytes,
                    usage = "ANY /proxy/{**path} -> UpstreamBaseUrl + path (+ query). Chaos middleware applies to /proxy/*.",
                    threatModel = "Default-deny allowlist; no redirects; no metadata hosts; body size limits."
                });
            })
            .WithName("GetProxyConfig")
            .WithTags("Proxy");

        app.MapMethods(
                "/proxy/{**path}",
                ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
                async Task (
                    HttpContext context,
                    string? path,
                    ProxyTargetBuilder targets,
                    ProxyForwarder forwarder,
                    CancellationToken cancellationToken) =>
                {
                    if (!targets.TryCreateTarget(path, context.Request.QueryString, out var target, out var error))
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsJsonAsync(new
                        {
                            error = "proxy-denied",
                            message = error,
                            hint = "Check Proxy:UpstreamBaseUrl and Proxy:AllowedHosts in appsettings."
                        }, cancellationToken);
                        return;
                    }

                    try
                    {
                        await forwarder.ForwardAsync(context, target, cancellationToken);
                    }
                    catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
                    {
                        if (!context.Response.HasStarted)
                        {
                            context.Response.StatusCode = StatusCodes.Status504GatewayTimeout;
                            await context.Response.WriteAsJsonAsync(new
                            {
                                error = "proxy-timeout",
                                message = "Upstream request timed out."
                            }, CancellationToken.None);
                        }
                    }
                    catch (HttpRequestException)
                    {
                        if (!context.Response.HasStarted)
                        {
                            context.Response.StatusCode = StatusCodes.Status502BadGateway;
                            await context.Response.WriteAsJsonAsync(new
                            {
                                error = "proxy-upstream-error",
                                message = "Upstream request failed."
                            }, cancellationToken);
                        }
                    }
                })
            .WithName("ChaosProxyForward")
            .WithTags("Proxy");

        return app;
    }
}
