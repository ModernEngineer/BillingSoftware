using Microsoft.Data.SqlClient;

namespace BillingErp.Api.Data;

// Applies every stored procedure under Data/StoredProcedures/*.sql on startup, right after EF
// Core migrations run. Each file must be exactly one `CREATE OR ALTER PROCEDURE ...` statement
// (no "GO" batch separators — SqlCommand can't parse those) so it can be executed as-is.
public static class SqlScriptRunner
{
    public static async Task ApplyAllAsync(string connectionString, string scriptsDirectory)
    {
        if (!Directory.Exists(scriptsDirectory))
            throw new DirectoryNotFoundException($"Stored procedure scripts directory not found: {scriptsDirectory}");

        var files = Directory.GetFiles(scriptsDirectory, "*.sql").OrderBy(f => f, StringComparer.Ordinal);

        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        foreach (var file in files)
        {
            var sql = await File.ReadAllTextAsync(file);
            await using var command = connection.CreateCommand();
            command.CommandText = sql;
            command.CommandTimeout = 60;
            try
            {
                await command.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed applying stored procedure script: {Path.GetFileName(file)}", ex);
            }
        }
    }
}
