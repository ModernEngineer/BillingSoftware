CREATE OR ALTER PROCEDURE dbo.sp_Product_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.Id, p.Name, p.Sku, p.Barcode,
        p.CategoryId, c.Name AS CategoryName,
        p.BrandId, b.Name AS BrandName, b.Status AS BrandStatus,
        p.UnitId, u.Name AS UnitName, u.ShortName AS UnitShortName,
        p.HsnCode, p.PurchasePrice, p.SellingPrice, p.Mrp, p.GstRate,
        p.OpeningStock, p.MinimumStock, p.MaximumStock, p.Description, p.Image, p.Status,
        p.CreatedAt, p.UpdatedAt,
        COALESCE(sb.Balance, 0) AS CurrentStock
    FROM dbo.Products p
    LEFT JOIN dbo.Categories c ON c.Id = p.CategoryId
    LEFT JOIN dbo.Brands b ON b.Id = p.BrandId
    JOIN dbo.Units u ON u.Id = p.UnitId
    OUTER APPLY (
        SELECT COALESCE(SUM(QuantityIn), 0) - COALESCE(SUM(QuantityOut), 0) AS Balance
        FROM dbo.StockTransactions st WHERE st.ProductId = p.Id
    ) sb
    ORDER BY p.Name ASC;
END
