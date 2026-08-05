namespace ZenoMock.Api.Services.Proxy;

public sealed class ProxyOptions
{
    public const string SectionName = "Proxy";

    /// <summary>When false, /proxy returns 503.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Base URL for forwards, e.g. https://httpbin.org or http://127.0.0.1:8080.</summary>
    public string UpstreamBaseUrl { get; set; } = "https://httpbin.org";

    /// <summary>Exact host allowlist (no ports). Empty = deny all.</summary>
    public string[] AllowedHosts { get; set; } = ["httpbin.org"];

    public int TimeoutSeconds { get; set; } = 10;

    public int MaxRequestBodyBytes { get; set; } = 64 * 1024;

    public int MaxResponseBodyBytes { get; set; } = 1024 * 1024;
}
