using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace ZenoMock.Api.Services.Boundary;

public static class BoundaryGenerator
{
    private static readonly string[] CombiningMarks =
    [
        "\u0300", "\u0301", "\u0302", "\u0303", "\u0304",
        "\u0308", "\u030A", "\u0315", "\u031B", "\u0340",
        "\u0341", "\u0358", "\u035C", "\u0360", "\u0361",
        "\u0489", "\u20E0", "\u20E3", "\u20DD", "\u0336"
    ];

    private static readonly string[] XssPayloads =
    [
        "<script>alert(1)</script>",
        "\" onmouseover=\"alert(1)",
        "'-alert(1)-'",
        "<img src=x onerror=alert(1)>",
        "javascript:alert(1)",
        "<svg/onload=alert(1)>",
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "{{constructor.constructor('alert(1)')()}}",
        "<iframe src=\"javascript:alert(1)\">"
    ];

    public static object CreateZalgo(int count = 5)
    {
        count = Math.Clamp(count, 1, 20);
        var samples = Enumerable.Range(0, count)
            .Select(_ => Corrupt("Zalgo text sample"))
            .ToArray();

        return new
        {
            endpoint = "GET /api/v1/boundary/strings/zalgo",
            count,
            samples
        };
    }

    public static object CreateXssPayloads()
    {
        return new
        {
            endpoint = "GET /api/v1/boundary/strings/xss-payloads",
            count = XssPayloads.Length,
            samples = XssPayloads
        };
    }

    public static object CreateOverflow(int length = 10_000)
    {
        length = Math.Clamp(length, 1, 100_000);
        return new
        {
            endpoint = "GET /api/v1/boundary/strings/overflow",
            length,
            sample = new string('A', length)
        };
    }

    public static object FuzzJson(JsonElement body)
    {
        JsonNode? node;
        try
        {
            node = JsonNode.Parse(body.GetRawText());
        }
        catch (JsonException)
        {
            throw new ArgumentException("Request body must be valid JSON.");
        }

        if (node is null)
        {
            throw new ArgumentException("Request body must be a JSON value.");
        }

        var original = JsonNode.Parse(node.ToJsonString())!;
        var mutations = new List<string>();
        ApplyFuzz(node, mutations, Random.Shared, depth: 0);

        return new
        {
            endpoint = "POST /api/v1/boundary/fuzz-json",
            original,
            fuzzed = node,
            mutations
        };
    }

    private static string Corrupt(string input)
    {
        var sb = new StringBuilder(input.Length * 4);
        foreach (var ch in input)
        {
            sb.Append(ch);
            var marks = Random.Shared.Next(2, 8);
            for (var i = 0; i < marks; i++)
            {
                sb.Append(CombiningMarks[Random.Shared.Next(CombiningMarks.Length)]);
            }
        }

        return sb.ToString();
    }

    private static void ApplyFuzz(JsonNode node, List<string> mutations, Random rng, int depth)
    {
        if (depth > 6)
        {
            return;
        }

        switch (node)
        {
            case JsonObject obj:
                FuzzObject(obj, mutations, rng, depth);
                break;
            case JsonArray arr:
                FuzzArray(arr, mutations, rng, depth);
                break;
        }
    }

    private static void FuzzObject(JsonObject obj, List<string> mutations, Random rng, int depth)
    {
        var keys = obj.Select(p => p.Key).ToList();
        if (keys.Count == 0)
        {
            return;
        }

        if (keys.Count > 1 && rng.NextDouble() < 0.7)
        {
            var drop = keys[rng.Next(keys.Count)];
            obj.Remove(drop);
            mutations.Add($"removed:{drop}");
            keys = obj.Select(p => p.Key).ToList();
        }

        foreach (var key in keys.ToList())
        {
            var child = obj[key];
            if (child is null)
            {
                continue;
            }

            if (child is JsonObject or JsonArray)
            {
                ApplyFuzz(child, mutations, rng, depth + 1);
                continue;
            }

            if (rng.NextDouble() < 0.55)
            {
                obj[key] = MismatchValue(child, rng);
                mutations.Add($"typeMismatch:{key}");
            }
        }
    }

    private static void FuzzArray(JsonArray arr, List<string> mutations, Random rng, int depth)
    {
        for (var i = 0; i < arr.Count; i++)
        {
            var item = arr[i];
            if (item is JsonObject or JsonArray)
            {
                ApplyFuzz(item, mutations, rng, depth + 1);
            }
            else if (item is not null && rng.NextDouble() < 0.4)
            {
                arr[i] = MismatchValue(item, rng);
                mutations.Add($"typeMismatch:[{i}]");
            }
        }

        if (arr.Count > 0 && rng.NextDouble() < 0.35)
        {
            var index = rng.Next(arr.Count);
            arr.RemoveAt(index);
            mutations.Add($"removed:[{index}]");
        }
    }

    private static JsonNode MismatchValue(JsonNode current, Random rng)
    {
        return current switch
        {
            JsonValue v when v.TryGetValue<bool>(out _) => rng.Next(0, 100),
            JsonValue v when v.TryGetValue<double>(out _) || v.TryGetValue<long>(out _)
                => $"not-a-number-{rng.Next(1000)}",
            JsonValue v when v.TryGetValue<string>(out _) => rng.Next(0, 2) == 0
                ? true
                : rng.Next(10, 99),
            _ => "unexpected"
        };
    }
}
