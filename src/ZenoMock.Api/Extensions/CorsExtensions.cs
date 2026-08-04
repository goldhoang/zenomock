namespace ZenoMock.Api.Extensions;

public static class CorsExtensions
{
    public const string PolicyName = "ZenoMockCors";

    public static IServiceCollection AddZenoMockCors(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? [];

        allowedOrigins = allowedOrigins
            .Where(o => !string.IsNullOrWhiteSpace(o))
            .Select(o => o.Trim().TrimEnd('/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        services.AddCors(options =>
        {
            options.AddPolicy(PolicyName, policy =>
            {
                if (allowedOrigins.Length > 0)
                {
                    policy.WithOrigins(allowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                    return;
                }

                if (environment.IsDevelopment())
                {
                    policy.WithOrigins(
                            "http://localhost:49231",
                            "http://127.0.0.1:49231",
                            "https://goldhoang.github.io")
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                    return;
                }

                policy.SetIsOriginAllowed(_ => false);
            });
        });

        return services;
    }
}
