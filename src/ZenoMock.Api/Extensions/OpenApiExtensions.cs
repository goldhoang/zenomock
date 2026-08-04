namespace ZenoMock.Api.Extensions;

public static class OpenApiExtensions
{
    public static IServiceCollection AddZenoMockOpenApi(this IServiceCollection services)
    {
        services.AddOpenApi();
        return services;
    }

    public static WebApplication UseZenoMockOpenApi(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        return app;
    }
}
