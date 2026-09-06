namespace BillingErp.Api.Auth;

// bcrypt is the same hash format bcryptjs (used by the original Next.js lib/auth.ts) produces,
// so hashes carried over via the Phase B data migration verify correctly without rehashing.
public static class PasswordHasher
{
    public static string Hash(string plain) => BCrypt.Net.BCrypt.HashPassword(plain, workFactor: 10);

    public static bool Verify(string plain, string hash) => BCrypt.Net.BCrypt.Verify(plain, hash);
}
