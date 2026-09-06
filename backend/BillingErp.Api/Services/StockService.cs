using System.Data;
using BillingErp.Api.Data;
using Dapper;

namespace BillingErp.Api.Services;

public record RecordStockTransactionParams(
    int ProductId,
    string Type,
    decimal? QuantityIn,
    decimal? QuantityOut,
    string? ReferenceType,
    int? ReferenceId,
    string? Note,
    int CreatedById);

public record StockTransactionResult(int TransactionId, decimal NewBalance);

// Ports src/lib/stock.ts — backed by sp_Stock_GetBalance/sp_Stock_GetBalances/sp_Stock_RecordTransaction.
// RecordStockTransactionAsync must be called with a connection/transaction that also covers the
// caller's other writes for the same request (pass an existing IDbConnection + IDbTransaction).
public class StockService(SqlConnectionFactory connectionFactory)
{
    private record BalanceRow(int ProductId, decimal Balance);

    public async Task<decimal> GetStockBalanceAsync(int productId)
    {
        using var connection = connectionFactory.Create();
        return await connection.ExecuteScalarAsync<decimal>(
            "dbo.sp_Stock_GetBalance",
            new { ProductId = productId },
            commandType: CommandType.StoredProcedure);
    }

    public async Task<Dictionary<int, decimal>> GetStockBalancesAsync(IEnumerable<int>? productIds = null)
    {
        var json = productIds is null ? null : System.Text.Json.JsonSerializer.Serialize(productIds);
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<BalanceRow>(
            "dbo.sp_Stock_GetBalances",
            new { ProductIdsJson = json },
            commandType: CommandType.StoredProcedure);
        return rows.ToDictionary(r => r.ProductId, r => r.Balance);
    }

    public async Task<StockTransactionResult> RecordStockTransactionAsync(
        IDbConnection connection, IDbTransaction transaction, RecordStockTransactionParams p)
    {
        var parameters = new DynamicParameters();
        parameters.Add("ProductId", p.ProductId);
        parameters.Add("Type", p.Type);
        parameters.Add("QuantityIn", p.QuantityIn ?? 0);
        parameters.Add("QuantityOut", p.QuantityOut ?? 0);
        parameters.Add("ReferenceType", p.ReferenceType);
        parameters.Add("ReferenceId", p.ReferenceId);
        parameters.Add("Note", p.Note);
        parameters.Add("CreatedById", p.CreatedById);
        parameters.Add("NewBalance", dbType: DbType.Decimal, direction: ParameterDirection.Output, precision: 18, scale: 2);
        parameters.Add("TransactionId", dbType: DbType.Int32, direction: ParameterDirection.Output);

        await connection.ExecuteAsync(
            "dbo.sp_Stock_RecordTransaction",
            parameters,
            transaction,
            commandType: CommandType.StoredProcedure);

        return new StockTransactionResult(
            parameters.Get<int>("TransactionId"),
            parameters.Get<decimal>("NewBalance"));
    }
}
