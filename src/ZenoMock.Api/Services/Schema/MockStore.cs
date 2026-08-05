using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace ZenoMock.Api.Services.Schema;

public sealed class MockStore
{
    public const int MaxEntities = 20;
    public const int MaxRecordsPerEntity = 200;
    public const int MaxSeedCount = 50;
    public const int MaxBodyBytes = 64 * 1024;

    private static readonly Regex EntityNamePattern = new(
        "^[a-z][a-z0-9_-]{0,63}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly ConcurrentDictionary<string, EntityBucket> _entities = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _gate = new();

    public IReadOnlyList<object> ListSchemas()
    {
        return _entities.Values
            .OrderBy(e => e.Name, StringComparer.OrdinalIgnoreCase)
            .Select(e => new
            {
                entity = e.Name,
                schema = e.Schema,
                recordCount = e.Records.Count,
                createdAt = e.CreatedAt
            })
            .Cast<object>()
            .ToList();
    }

    public object RegisterSchema(RegisterSchemaRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Entity))
        {
            throw new ArgumentException("Entity name is required.");
        }

        var entity = request.Entity.Trim().ToLowerInvariant();
        if (!EntityNamePattern.IsMatch(entity))
        {
            throw new ArgumentException(
                "Entity must match ^[a-z][a-z0-9_-]{0,63}$ (lowercase letters, digits, _ or -).");
        }

        if (request.Schema.ValueKind is not JsonValueKind.Object)
        {
            throw new ArgumentException("schema must be a JSON object.");
        }

        JsonNode schemaNode;
        try
        {
            schemaNode = JsonNode.Parse(request.Schema.GetRawText())
                ?? throw new ArgumentException("schema must be a JSON object.");
        }
        catch (JsonException ex)
        {
            throw new ArgumentException("schema must be valid JSON.", ex);
        }

        var properties = ExtractProperties(schemaNode);
        if (properties.Count == 0)
        {
            throw new ArgumentException("schema.properties must define at least one field.");
        }

        var seedCount = Math.Clamp(request.SeedCount ?? 3, 0, MaxSeedCount);

        lock (_gate)
        {
            if (!_entities.ContainsKey(entity) && _entities.Count >= MaxEntities)
            {
                throw new InvalidOperationException($"Maximum of {MaxEntities} entities reached.");
            }

            var bucket = new EntityBucket(entity, schemaNode, properties);
            for (var i = 0; i < seedCount; i++)
            {
                bucket.Add(GenerateRecord(bucket));
            }

            _entities[entity] = bucket;

            return new
            {
                entity = bucket.Name,
                schema = bucket.Schema,
                seeded = seedCount,
                recordCount = bucket.Records.Count,
                endpoints = new
                {
                    list = $"GET /api/v1/mock/{bucket.Name}",
                    create = $"POST /api/v1/mock/{bucket.Name}",
                    getById = $"GET /api/v1/mock/{bucket.Name}/{{id}}"
                }
            };
        }
    }

    public object ListRecords(string entity)
    {
        var bucket = Require(entity);
        var items = bucket.Records.Values
            .OrderBy(r => r["id"]?.GetValue<string>(), StringComparer.Ordinal)
            .Select(CloneObject)
            .ToList();

        return new
        {
            entity = bucket.Name,
            count = items.Count,
            items
        };
    }

    public object CreateRecord(string entity, JsonElement body)
    {
        EnsureBodySize(body);
        var bucket = Require(entity);

        lock (bucket.Sync)
        {
            if (bucket.Records.Count >= MaxRecordsPerEntity)
            {
                throw new InvalidOperationException(
                    $"Entity '{bucket.Name}' reached the limit of {MaxRecordsPerEntity} records.");
            }

            var record = MergeCreate(bucket, body);
            bucket.Add(record);
            return CloneObject(record);
        }
    }

    public object? GetRecord(string entity, string id)
    {
        var bucket = Require(entity);
        return bucket.Records.TryGetValue(id, out var record) ? CloneObject(record) : null;
    }

    private EntityBucket Require(string entity)
    {
        if (string.IsNullOrWhiteSpace(entity) || !_entities.TryGetValue(entity.Trim(), out var bucket))
        {
            throw new KeyNotFoundException($"Unknown entity '{entity}'. Register it via POST /api/v1/schemas first.");
        }

        return bucket;
    }

    private static void EnsureBodySize(JsonElement body)
    {
        if (body.GetRawText().Length > MaxBodyBytes)
        {
            throw new ArgumentException($"Request body exceeds {MaxBodyBytes} bytes.");
        }
    }

    private static Dictionary<string, string> ExtractProperties(JsonNode schema)
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (schema is not JsonObject root
            || root["properties"] is not JsonObject props)
        {
            return map;
        }

        foreach (var (name, node) in props)
        {
            var type = "string";
            if (node is JsonObject field
                && field["type"] is JsonValue typeValue
                && typeValue.TryGetValue<string>(out var typeName)
                && !string.IsNullOrWhiteSpace(typeName))
            {
                type = typeName;
            }

            map[name] = type.ToLowerInvariant();
        }

        return map;
    }

    private static JsonObject GenerateRecord(EntityBucket bucket)
    {
        var obj = new JsonObject
        {
            ["id"] = Guid.NewGuid().ToString("N")[..8]
        };

        foreach (var (name, type) in bucket.Properties)
        {
            if (name.Equals("id", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            obj[name] = SampleValue(type, name);
        }

        return obj;
    }

    private static JsonObject MergeCreate(EntityBucket bucket, JsonElement body)
    {
        if (body.ValueKind != JsonValueKind.Object)
        {
            throw new ArgumentException("Request body must be a JSON object.");
        }

        var obj = GenerateRecord(bucket);
        foreach (var prop in body.EnumerateObject())
        {
            if (prop.Name.Equals("id", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            obj[prop.Name] = JsonNode.Parse(prop.Value.GetRawText());
        }

        return obj;
    }

    private static JsonObject CloneObject(JsonObject source) =>
        (JsonObject)JsonNode.Parse(source.ToJsonString())!;

    private static JsonNode SampleValue(string type, string fieldName) =>
        type switch
        {
            "number" or "integer" => Random.Shared.Next(1, 999),
            "boolean" => Random.Shared.Next(0, 2) == 0,
            "array" => new JsonArray($"{fieldName}-a", $"{fieldName}-b"),
            "object" => new JsonObject { ["label"] = fieldName },
            _ => $"{fieldName}-{Random.Shared.Next(100, 999)}"
        };

    private sealed class EntityBucket(
        string name,
        JsonNode schema,
        Dictionary<string, string> properties)
    {
        public string Name { get; } = name;
        public JsonNode Schema { get; } = schema;
        public Dictionary<string, string> Properties { get; } = properties;
        public DateTimeOffset CreatedAt { get; } = DateTimeOffset.UtcNow;
        public ConcurrentDictionary<string, JsonObject> Records { get; } = new(StringComparer.Ordinal);
        public object Sync { get; } = new();

        public void Add(JsonObject record)
        {
            var id = record["id"]!.GetValue<string>();
            Records[id] = record;
        }
    }
}

public sealed class RegisterSchemaRequest
{
    public string? Entity { get; set; }
    public JsonElement Schema { get; set; }
    public int? SeedCount { get; set; }
}
