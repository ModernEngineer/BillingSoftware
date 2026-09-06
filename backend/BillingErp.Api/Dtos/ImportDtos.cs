using System.Text.Json;

namespace BillingErp.Api.Dtos;

public record ImportRequest(List<Dictionary<string, JsonElement>>? Rows);

public record ImportRowError(int Row, string Message);

public record ImportResult(int Inserted, List<ImportRowError> Errors);
