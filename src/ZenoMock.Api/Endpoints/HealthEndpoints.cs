using System.Reflection;

namespace ZenoMock.Api.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", () =>
        {
            var version = Assembly.GetExecutingAssembly()
                .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
                ?.InformationalVersion
                ?? "0.1.0";

            return Results.Ok(new
            {
                status = "ok",
                service = "zenomock",
                mode = "local-engine",
                version
            });
        })
        .WithName("Health")
        .WithTags("Diagnostics");

        return app;
    }
}
