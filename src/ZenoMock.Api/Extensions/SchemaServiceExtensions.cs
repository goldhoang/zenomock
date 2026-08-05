using ZenoMock.Api.Services.Schema;

namespace ZenoMock.Api.Extensions;

public static class SchemaServiceExtensions
{
    public static IServiceCollection AddZenoMockSchemaStore(this IServiceCollection services)
    {
        services.AddSingleton<MockStore>();
        return services;
    }
}
