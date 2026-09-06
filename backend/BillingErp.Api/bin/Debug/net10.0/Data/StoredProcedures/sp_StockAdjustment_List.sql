CREATE OR ALTER PROCEDURE dbo.sp_StockAdjustment_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        a.Id, a.ProductId, p.Name AS ProductName, p.Sku AS ProductSku,
        a.AdjustmentType, a.Quantity, a.Reason, a.Note,
        a.CreatedById, u.Name AS CreatedByName, a.CreatedAt
    FROM dbo.StockAdjustments a
    JOIN dbo.Products p ON p.Id = a.ProductId
    JOIN dbo.Users u ON u.Id = a.CreatedById
    ORDER BY a.Id DESC;
END
