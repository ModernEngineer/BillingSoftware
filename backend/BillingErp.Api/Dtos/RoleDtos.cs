namespace BillingErp.Api.Dtos;

public record RoleUpdatePermissionsRequest(Dictionary<string, List<string>> Permissions);
