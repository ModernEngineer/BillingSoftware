-- Two result sets: 1) active products with category/unit, 2) per-product-per-type in/out sums.
-- The per-type netting math (opening/purchase/sales/returns/adjustments -> currentStock/status)
-- is done in C# (StockReportService), mirroring src/app/api/inventory/stock/route.ts exactly.
CREATE OR ALTER PROCEDURE dbo.sp_Stock_CurrentReport
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        p.Id, p.Name, p.Sku, p.PurchasePrice, p.MinimumStock,
        p.CategoryId, c.Name AS CategoryName,
        p.UnitId, u.Name AS UnitName, u.ShortName AS UnitShortName
    FROM dbo.Products p
    LEFT JOIN dbo.Categories c ON c.Id = p.CategoryId
    JOIN dbo.Units u ON u.Id = p.UnitId
    WHERE p.Status = 1
    ORDER BY p.Name ASC;

    SELECT ProductId, Type, SUM(QuantityIn) AS QuantityIn, SUM(QuantityOut) AS QuantityOut
    FROM dbo.StockTransactions
    GROUP BY ProductId, Type;
END
