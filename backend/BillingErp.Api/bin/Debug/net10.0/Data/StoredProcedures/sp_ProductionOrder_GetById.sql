CREATE OR ALTER PROCEDURE dbo.sp_ProductionOrder_GetById
    @OrderId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        o.Id, o.OrderNumber, o.ProductId, p.Name AS ProductName, p.Sku AS ProductSku,
        o.Quantity, o.Status, o.StartDate, o.EndDate, o.Notes,
        o.CreatedById, u.Name AS CreatedByName, o.CreatedAt
    FROM dbo.ProductionOrders o
    JOIN dbo.Products p ON p.Id = o.ProductId
    JOIN dbo.Users u ON u.Id = o.CreatedById
    WHERE o.Id = @OrderId;
END
