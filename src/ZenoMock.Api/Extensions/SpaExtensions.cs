namespace ZenoMock.Api.Extensions;

public static class SpaExtensions
{
    public static WebApplication UseZenoMockStaticFiles(this WebApplication app)
    {
        app.UseDefaultFiles();
        app.UseStaticFiles();
        return app;
    }

    /// <summary>
    /// SPA fallback for non-API routes. Register after API endpoint maps.
    /// </summary>
    public static WebApplication MapZenoMockSpaFallback(this WebApplication app)
    {
        app.MapFallbackToFile("index.html");
        return app;
    }
}
