using Microsoft.Extensions.Options;

namespace ZenoMock.Api.Services.Proxy;

public sealed class ProxyTargetBuilder(IOptions<ProxyOptions> options)
{
    private readonly ProxyOptions _options = options.Value;

    public ProxyOptions Options => _options;

    public bool TryCreateTarget(string? remnantPath, QueryString query, out Uri target, out string error)
    {
        target = null!;
        error = string.Empty;

        if (!_options.Enabled)
        {
            error = "Proxy is disabled in configuration.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(_options.UpstreamBaseUrl))
        {
            error = "Proxy:UpstreamBaseUrl is not configured.";
            return false;
        }

        if (_options.AllowedHosts is null || _options.AllowedHosts.Length == 0)
        {
            error = "Proxy allowlist is empty — all forwards are denied.";
            return false;
        }

        if (!Uri.TryCreate(_options.UpstreamBaseUrl, UriKind.Absolute, out var baseUri))
        {
            error = "Proxy:UpstreamBaseUrl is not a valid absolute URI.";
            return false;
        }

        if (!IsAllowedScheme(baseUri.Scheme))
        {
            error = "Only http and https upstream schemes are allowed.";
            return false;
        }

        if (!string.IsNullOrEmpty(baseUri.UserInfo))
        {
            error = "Upstream URL must not contain userinfo credentials.";
            return false;
        }

        if (!IsHostAllowlisted(baseUri.Host))
        {
            error = $"Upstream host '{baseUri.Host}' is not in Proxy:AllowedHosts.";
            return false;
        }

        // Explicit block for cloud metadata even if misconfigured in allowlist.
        if (IsMetadataHost(baseUri.Host))
        {
            error = "Cloud metadata hosts are never allowed.";
            return false;
        }

        var relative = NormalizeRemnant(remnantPath);
        if (relative.StartsWith("proxy/", StringComparison.OrdinalIgnoreCase)
            || relative.Equals("proxy", StringComparison.OrdinalIgnoreCase))
        {
            error = "Refusing to forward nested /proxy paths (recursion guard).";
            return false;
        }

        var combined = Combine(baseUri, relative, query);
        if (!IsHostAllowlisted(combined.Host) || IsMetadataHost(combined.Host))
        {
            error = $"Resolved host '{combined.Host}' is not allowlisted.";
            return false;
        }

        if (!IsAllowedScheme(combined.Scheme) || !string.IsNullOrEmpty(combined.UserInfo))
        {
            error = "Resolved upstream URI failed security checks.";
            return false;
        }

        target = combined;
        return true;
    }

    private static string NormalizeRemnant(string? remnantPath)
    {
        if (string.IsNullOrWhiteSpace(remnantPath))
        {
            return string.Empty;
        }

        return remnantPath.Trim().TrimStart('/');
    }

    private static Uri Combine(Uri baseUri, string relative, QueryString query)
    {
        var baseText = baseUri.AbsoluteUri.TrimEnd('/') + "/";
        var pathUri = string.IsNullOrEmpty(relative)
            ? new Uri(baseText)
            : new Uri(new Uri(baseText), relative);

        if (!query.HasValue)
        {
            return pathUri;
        }

        var builder = new UriBuilder(pathUri)
        {
            Query = query.Value.TrimStart('?')
        };
        return builder.Uri;
    }

    private bool IsHostAllowlisted(string host)
    {
        foreach (var allowed in _options.AllowedHosts)
        {
            if (string.Equals(allowed?.Trim(), host, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsAllowedScheme(string scheme) =>
        scheme.Equals(Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
        || scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase);

    private static bool IsMetadataHost(string host) =>
        host.Equals("169.254.169.254", StringComparison.OrdinalIgnoreCase)
        || host.Equals("metadata.google.internal", StringComparison.OrdinalIgnoreCase);
}
