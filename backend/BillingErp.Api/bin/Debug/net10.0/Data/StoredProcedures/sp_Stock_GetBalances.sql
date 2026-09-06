CREATE OR ALTER PROCEDURE dbo.sp_Stock_GetBalances
    @ProductIdsJson NVARCHAR(MAX) = NULL -- JSON array of ints; NULL = every product with stock history
AS
BEGIN
    SET NOCOUNT ON;

    IF @ProductIdsJson IS NULL
    BEGIN
        SELECT ProductId, COALESCE(SUM(QuantityIn), 0) - COALESCE(SUM(QuantityOut), 0) AS Balance
        FROM dbo.StockTransactions
        GROUP BY ProductId;
    END
    ELSE
    BEGIN
        SELECT t.ProductId, COALESCE(SUM(t.QuantityIn), 0) - COALESCE(SUM(t.QuantityOut), 0) AS Balance
        FROM dbo.StockTransactions t
        WHERE t.ProductId IN (SELECT value FROM OPENJSON(@ProductIdsJson))
        GROUP BY t.ProductId;
    END
END
