CREATE OR ALTER PROCEDURE dbo.sp_Stock_GetBalance
    @ProductId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COALESCE(SUM(QuantityIn), 0) - COALESCE(SUM(QuantityOut), 0) AS Balance
    FROM dbo.StockTransactions
    WHERE ProductId = @ProductId;
END
