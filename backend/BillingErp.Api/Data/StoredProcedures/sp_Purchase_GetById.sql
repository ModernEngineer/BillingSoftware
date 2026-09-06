-- Result sets (Dapper QueryMultipleAsync order): 1) Purchase row, 2) Supplier row, 3) creator Name,
-- 4) PurchaseItems joined with Product (Product_* prefixed), 5) Payments.
CREATE OR ALTER PROCEDURE dbo.sp_Purchase_GetById
    @PurchaseId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT * FROM dbo.Purchases WHERE Id = @PurchaseId;

    SELECT * FROM dbo.Suppliers WHERE Id = (SELECT SupplierId FROM dbo.Purchases WHERE Id = @PurchaseId);

    SELECT Name FROM dbo.Users WHERE Id = (SELECT CreatedById FROM dbo.Purchases WHERE Id = @PurchaseId);

    SELECT
        i.Id, i.PurchaseId, i.ProductId, i.ProductName, i.Quantity, i.Rate, i.Discount, i.GstRate,
        i.TaxableAmount, i.GstAmount, i.Total,
        p.Id AS Product_Id, p.Name AS Product_Name, p.Sku AS Product_Sku, p.Barcode AS Product_Barcode,
        p.CategoryId AS Product_CategoryId, p.BrandId AS Product_BrandId, p.UnitId AS Product_UnitId,
        p.HsnCode AS Product_HsnCode, p.PurchasePrice AS Product_PurchasePrice, p.SellingPrice AS Product_SellingPrice,
        p.Mrp AS Product_Mrp, p.GstRate AS Product_GstRate, p.OpeningStock AS Product_OpeningStock,
        p.MinimumStock AS Product_MinimumStock, p.MaximumStock AS Product_MaximumStock,
        p.Description AS Product_Description, p.Image AS Product_Image, p.Status AS Product_Status,
        p.CreatedAt AS Product_CreatedAt, p.UpdatedAt AS Product_UpdatedAt
    FROM dbo.PurchaseItems i
    JOIN dbo.Products p ON p.Id = i.ProductId
    WHERE i.PurchaseId = @PurchaseId;

    SELECT * FROM dbo.Payments WHERE PurchaseId = @PurchaseId;
END
