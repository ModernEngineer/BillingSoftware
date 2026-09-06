using System.Data;
using Microsoft.Data.SqlClient;

namespace BillingErp.Api.Data;

// Hands out raw ADO.NET connections for Dapper — every runtime read/write in this app goes
// through a stored procedure called via Dapper, not EF Core (EF Core is schema/migrations only).
public class SqlConnectionFactory(IConfiguration config)
{
    private readonly string _connectionString = config.GetConnectionString("Default")
        ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured");

    public IDbConnection Create() => new SqlConnection(_connectionString);
}
