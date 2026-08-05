using ZenoMock.Api.Middleware;
using ZenoMock.Api.Services.Chaos;

namespace ZenoMock.Api.Extensions;

public static class ChaosExtensions
{
    public static IServiceCollection AddZenoMockChaos(this IServiceCollection services)
    {
        services.AddSingleton<ChaosConfigStore>();
        return services;
    }

    public static WebApplication UseZenoMockChaos(this WebApplication app)
    {
        app.UseMiddleware<ChaosMiddleware>();
        return app;
    }
}
