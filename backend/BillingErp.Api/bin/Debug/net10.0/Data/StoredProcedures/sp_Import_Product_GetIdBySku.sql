CREATE OR ALTER PROCEDURE dbo.sp_Import_Product_GetIdBySku
    @Sku NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id FROM dbo.Products WHERE Sku = @Sku;
END
