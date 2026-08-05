using ZenoMock.Api.Services.Chaos;

namespace ZenoMock.Api.Endpoints;

public static class ChaosEndpoints
{
    public static IEndpointRouteBuilder MapChaosEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/chaos")
            .WithTags("Chaos");

        group.MapGet("/config", (ChaosConfigStore store) =>
            {
                var config = store.Snapshot();
                return Results.Ok(new
                {
                    endpoint = "GET /api/v1/chaos/config",
                    latencyMs = config.LatencyMs,
                    error500Rate = config.Error500Rate,
                    corruptedJsonRate = config.CorruptedJsonRate,
                    appliesTo = "/api/* except /api/v1/chaos/* and /health"
                });
            })
            .WithName("GetChaosConfig");

        group.MapPost("/config", (ChaosOptions request, ChaosConfigStore store) =>
            {
                var updated = store.Update(request);
                return Results.Ok(new
                {
                    endpoint = "POST /api/v1/chaos/config",
                    latencyMs = updated.LatencyMs,
                    error500Rate = updated.Error500Rate,
                    corruptedJsonRate = updated.CorruptedJsonRate,
                    message = "Chaos config updated for this process."
                });
            })
            .WithName("SetChaosConfig");

        group.MapPost("/reset", (ChaosConfigStore store) =>
            {
                store.Reset();
                var config = store.Snapshot();
                return Results.Ok(new
                {
                    endpoint = "POST /api/v1/chaos/reset",
                    latencyMs = config.LatencyMs,
                    error500Rate = config.Error500Rate,
                    corruptedJsonRate = config.CorruptedJsonRate,
                    message = "Chaos config reset to defaults."
                });
            })
            .WithName("ResetChaosConfig");

        return app;
    }
}
