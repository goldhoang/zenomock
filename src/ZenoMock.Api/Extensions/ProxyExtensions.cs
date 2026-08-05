using Microsoft.Extensions.Options;
using ZenoMock.Api.Services.Proxy;

namespace ZenoMock.Api.Extensions;

public static class ProxyExtensions
{
    public static IServiceCollection AddZenoMockProxy(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<ProxyOptions>(configuration.GetSection(ProxyOptions.SectionName));
        services.PostConfigure<ProxyOptions>(options =>
        {
            options.AllowedHosts = (options.AllowedHosts ?? [])
                .Where(h => !string.IsNullOrWhiteSpace(h))
                .Select(h => h.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
            options.TimeoutSeconds = Math.Clamp(options.TimeoutSeconds, 1, 60);
            options.MaxRequestBodyBytes = Math.Clamp(options.MaxRequestBodyBytes, 1024, 10 * 1024 * 1024);
            options.MaxResponseBodyBytes = Math.Clamp(options.MaxResponseBodyBytes, 1024, 10 * 1024 * 1024);
        });
        services.AddSingleton<ProxyTargetBuilder>();
        services.AddSingleton<ProxyForwarder>();

        var timeoutSeconds = configuration.GetValue($"{ProxyOptions.SectionName}:TimeoutSeconds", 10);
        timeoutSeconds = Math.Clamp(timeoutSeconds, 1, 60);

        services.AddHttpClient(ProxyForwarder.HttpClientName)
            .ConfigureHttpClient(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
                client.DefaultRequestHeaders.UserAgent.ParseAdd("ZenoMock-Proxy/0.1");
            })
            .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
            {
                AllowAutoRedirect = false,
                AutomaticDecompression = System.Net.DecompressionMethods.All,
                PooledConnectionLifetime = TimeSpan.FromMinutes(2)
            });

        return services;
    }
}
