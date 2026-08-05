using System.Text.Json;
using ZenoMock.Api.Services.Boundary;

namespace ZenoMock.Api.Endpoints;

public static class BoundaryEndpoints
{
    public static IEndpointRouteBuilder MapBoundaryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/boundary")
            .WithTags("Boundary");

        group.MapGet("/strings/zalgo", (int? count) =>
                Results.Ok(BoundaryGenerator.CreateZalgo(count ?? 5)))
            .WithName("BoundaryZalgo");

        group.MapGet("/strings/xss-payloads", () =>
                Results.Ok(BoundaryGenerator.CreateXssPayloads()))
            .WithName("BoundaryXssPayloads");

        group.MapGet("/strings/overflow", (int? length) =>
                Results.Ok(BoundaryGenerator.CreateOverflow(length ?? 10_000)))
            .WithName("BoundaryOverflow");

        group.MapPost("/fuzz-json", (JsonElement body) =>
            {
                try
                {
                    return Results.Ok(BoundaryGenerator.FuzzJson(body));
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(new { error = ex.Message });
                }
            })
            .WithName("BoundaryFuzzJson");

        return app;
    }
}
