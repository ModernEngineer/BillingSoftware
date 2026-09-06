namespace BillingErp.Api.Auth;

// Mirrors src/types/auth.ts SessionPayload exactly — these five field names are what
// jose's verifySessionToken() on the Next.js side expects as flat top-level JWT claims.
public record SessionPayload(int UserId, string Name, string Email, int RoleId, string RoleName);
