CREATE OR ALTER PROCEDURE dbo.sp_StockHistory_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1000
        t.Id, t.ProductId, p.Name AS ProductName, p.Sku AS ProductSku,
        t.Type, t.QuantityIn, t.QuantityOut, t.Balance, t.ReferenceType, t.ReferenceId, t.Note,
        t.CreatedById, u.Name AS CreatedByName, t.CreatedAt
    FROM dbo.StockTransactions t
    JOIN dbo.Products p ON p.Id = t.ProductId
    JOIN dbo.Users u ON u.Id = t.CreatedById
    ORDER BY t.Id DESC;
END
