using System.Text.Json.Serialization;
using ZenoMock.Api.Endpoints;
using ZenoMock.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddZenoMockCors(builder.Configuration, builder.Environment);
builder.Services.AddZenoMockOpenApi();
builder.Services.AddZenoMockSchemaStore();
builder.Services.AddZenoMockChaos();

var app = builder.Build();

app.UseZenoMockOpenApi();
app.UseCors(CorsExtensions.PolicyName);
app.UseZenoMockStaticFiles();
app.UseZenoMockChaos();

app.MapHealthEndpoints();
app.MapBoundaryEndpoints();
app.MapSchemaEndpoints();
app.MapChaosEndpoints();
app.MapZenoMockSpaFallback();

app.Run();

public partial class Program;
