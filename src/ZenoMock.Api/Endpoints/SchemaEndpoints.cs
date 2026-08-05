using System.Text.Json;
using ZenoMock.Api.Services.Schema;

namespace ZenoMock.Api.Endpoints;

public static class SchemaEndpoints
{
    public static IEndpointRouteBuilder MapSchemaEndpoints(this IEndpointRouteBuilder app)
    {
        var schemas = app.MapGroup("/api/v1/schemas").WithTags("Schema");
        var mock = app.MapGroup("/api/v1/mock").WithTags("Mock");

        schemas.MapGet("/", (MockStore store) => Results.Ok(new
            {
                endpoint = "GET /api/v1/schemas",
                count = store.ListSchemas().Count,
                schemas = store.ListSchemas()
            }))
            .WithName("ListSchemas");

        schemas.MapPost("/", (RegisterSchemaRequest request, MockStore store) =>
            {
                try
                {
                    return Results.Ok(store.RegisterSchema(request));
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(new { error = ex.Message });
                }
                catch (InvalidOperationException ex)
                {
                    return Results.Conflict(new { error = ex.Message });
                }
            })
            .WithName("RegisterSchema");

        mock.MapGet("/{entity}", (string entity, MockStore store) =>
            {
                try
                {
                    return Results.Ok(store.ListRecords(entity));
                }
                catch (KeyNotFoundException ex)
                {
                    return Results.NotFound(new { error = ex.Message });
                }
            })
            .WithName("ListMockRecords");

        mock.MapPost("/{entity}", (string entity, JsonElement body, MockStore store) =>
            {
                try
                {
                    return Results.Created(
                        $"/api/v1/mock/{entity}",
                        store.CreateRecord(entity, body));
                }
                catch (KeyNotFoundException ex)
                {
                    return Results.NotFound(new { error = ex.Message });
                }
                catch (ArgumentException ex)
                {
                    return Results.BadRequest(new { error = ex.Message });
                }
                catch (InvalidOperationException ex)
                {
                    return Results.Conflict(new { error = ex.Message });
                }
            })
            .WithName("CreateMockRecord");

        mock.MapGet("/{entity}/{id}", (string entity, string id, MockStore store) =>
            {
                try
                {
                    var record = store.GetRecord(entity, id);
                    return record is null
                        ? Results.NotFound(new { error = $"Record '{id}' not found in '{entity}'." })
                        : Results.Ok(record);
                }
                catch (KeyNotFoundException ex)
                {
                    return Results.NotFound(new { error = ex.Message });
                }
            })
            .WithName("GetMockRecord");

        return app;
    }
}
