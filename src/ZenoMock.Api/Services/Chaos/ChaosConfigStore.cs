namespace ZenoMock.Api.Services.Chaos;

public sealed class ChaosOptions
{
    public int LatencyMs { get; set; }

    /// <summary>Probability of injected HTTP 500 in [0, 1]. Stored snapped to whole percent.</summary>
    public double Error500Rate { get; set; }

    /// <summary>Probability of JSON corruption on 2xx in [0, 1]. Stored snapped to whole percent.</summary>
    public double CorruptedJsonRate { get; set; }

    public int Error500Percent => ToPercent(Error500Rate);

    public int CorruptedJsonPercent => ToPercent(CorruptedJsonRate);

    public ChaosOptions Clone() => new()
    {
        LatencyMs = LatencyMs,
        Error500Rate = Error500Rate,
        CorruptedJsonRate = CorruptedJsonRate
    };

    public static int ToPercent(double rate) =>
        Math.Clamp((int)Math.Round(rate * 100d, MidpointRounding.AwayFromZero), 0, 100);

    public static double FromPercent(int percent) => Math.Clamp(percent, 0, 100) / 100d;
}

public sealed class ChaosConfigStore
{
    public const int MaxLatencyMs = 30_000;

    private readonly object _gate = new();
    private ChaosOptions _current = new();

    public ChaosOptions Snapshot()
    {
        lock (_gate)
        {
            return _current.Clone();
        }
    }

    public ChaosOptions Update(ChaosOptions request)
    {
        ArgumentNullException.ThrowIfNull(request);

        // Snap to whole percents so UI 0%/100% and API doubles never drift (e.g. 0.999 → 100%).
        var next = new ChaosOptions
        {
            LatencyMs = Math.Clamp(request.LatencyMs, 0, MaxLatencyMs),
            Error500Rate = ChaosOptions.FromPercent(ChaosOptions.ToPercent(request.Error500Rate)),
            CorruptedJsonRate = ChaosOptions.FromPercent(ChaosOptions.ToPercent(request.CorruptedJsonRate))
        };

        lock (_gate)
        {
            _current = next;
            return _current.Clone();
        }
    }

    public void Reset()
    {
        lock (_gate)
        {
            _current = new ChaosOptions();
        }
    }
}

/// <summary>Deterministic edges: 0% never, 100% always; otherwise Next(100) &lt; percent.</summary>
public static class ChaosChance
{
    public static bool ShouldInject(int percentZeroToHundred)
    {
        if (percentZeroToHundred <= 0)
        {
            return false;
        }

        if (percentZeroToHundred >= 100)
        {
            return true;
        }

        return Random.Shared.Next(100) < percentZeroToHundred;
    }
}
