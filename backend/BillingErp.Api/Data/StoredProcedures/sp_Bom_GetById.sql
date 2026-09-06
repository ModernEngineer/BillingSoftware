CREATE OR ALTER PROCEDURE dbo.sp_Bom_GetById
    @BOMItemId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        b.Id, b.FinishedProductId, fp.Name AS FinishedProductName, fp.Sku AS FinishedProductSku,
        b.ComponentProductId, cp.Name AS ComponentProductName, cp.Sku AS ComponentProductSku,
        u.Name AS ComponentUnitName, u.ShortName AS ComponentUnitShortName,
        b.Quantity
    FROM dbo.BOMItems b
    JOIN dbo.Products fp ON fp.Id = b.FinishedProductId
    JOIN dbo.Products cp ON cp.Id = b.ComponentProductId
    JOIN dbo.Units u ON u.Id = cp.UnitId
    WHERE b.Id = @BOMItemId;
END
