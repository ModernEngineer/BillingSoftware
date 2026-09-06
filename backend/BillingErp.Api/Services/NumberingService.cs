using System.Data;
using Dapper;

namespace BillingErp.Api.Services;

// Ports src/lib/numbering.ts's getNextNumber — backed by sp_Numbering_GetNext. Must be called
// with the same connection/transaction as the caller's other writes for the same request.
public class NumberingService
{
    public async Task<string> GetNextNumberAsync(IDbConnection connection, IDbTransaction transaction, string kind)
    {
        var parameters = new DynamicParameters();
        parameters.Add("Kind", kind);
        parameters.Add("Number", dbType: DbType.String, direction: ParameterDirection.Output, size: 50);

        await connection.ExecuteAsync(
            "dbo.sp_Numbering_GetNext",
            parameters,
            transaction,
            commandType: CommandType.StoredProcedure);

        return parameters.Get<string>("Number");
    }
}
