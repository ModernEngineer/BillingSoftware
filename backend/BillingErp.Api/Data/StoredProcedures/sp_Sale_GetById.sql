-- Returns 5 result sets (read via Dapper QueryMultipleAsync, in this order):
-- 1) the Sale row itself
-- 2) the Customer row (0 rows if CustomerId is null / not found)
-- 3) the creator's Name (single scalar row)
-- 4) SaleItems joined with their Product (Product_* prefixed columns)
-- 5) Payments for this sale
CREATE OR ALTER PROCEDURE dbo.sp_Sale_GetById
    @SaleId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM dbo.Sales WHERE Id = @SaleId;

    SELECT * FROM dbo.Customers WHERE Id = (SELECT CustomerId FROM dbo.Sales WHERE Id = @SaleId);

    SELECT Name FROM dbo.Users WHERE Id = (SELECT CreatedById FROM dbo.Sales WHERE Id = @SaleId);

    SELECT
        i.Id, i.SaleId, i.ProductId, i.ProductName, i.Quantity, i.Rate, i.Discount, i.GstRate,
        i.TaxableAmount, i.GstAmount, i.Total,
        p.Id AS Product_Id, p.Name AS Product_Name, p.Sku AS Product_Sku, p.Barcode AS Product_Barcode,
        p.CategoryId AS Product_CategoryId, p.BrandId AS Product_BrandId, p.UnitId AS Product_UnitId,
        p.HsnCode AS Product_HsnCode, p.PurchasePrice AS Product_PurchasePrice, p.SellingPrice AS Product_SellingPrice,
        p.Mrp AS Product_Mrp, p.GstRate AS Product_GstRate, p.OpeningStock AS Product_OpeningStock,
        p.MinimumStock AS Product_MinimumStock, p.MaximumStock AS Product_MaximumStock,
        p.Description AS Product_Description, p.Image AS Product_Image, p.Status AS Product_Status,
        p.CreatedAt AS Product_CreatedAt, p.UpdatedAt AS Product_UpdatedAt
    FROM dbo.SaleItems i
    JOIN dbo.Products p ON p.Id = i.ProductId
    WHERE i.SaleId = @SaleId;

    SELECT * FROM dbo.Payments WHERE SaleId = @SaleId;
END
