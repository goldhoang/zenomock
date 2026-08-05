namespace ZenoMock.Api.Services.Chaos;

public sealed class ChaosOptions
{
    public int LatencyMs { get; set; }
    public double Error500Rate { get; set; }
    public double CorruptedJsonRate { get; set; }

    public ChaosOptions Clone() => new()
    {
        LatencyMs = LatencyMs,
        Error500Rate = Error500Rate,
        CorruptedJsonRate = CorruptedJsonRate
    };
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

        var next = new ChaosOptions
        {
            LatencyMs = Math.Clamp(request.LatencyMs, 0, MaxLatencyMs),
            Error500Rate = Math.Clamp(request.Error500Rate, 0, 1),
            CorruptedJsonRate = Math.Clamp(request.CorruptedJsonRate, 0, 1)
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
