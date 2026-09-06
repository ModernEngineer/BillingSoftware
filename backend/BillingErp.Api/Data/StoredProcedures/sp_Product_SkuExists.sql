CREATE OR ALTER PROCEDURE dbo.sp_Product_SkuExists
    @Sku NVARCHAR(100),
    @ExcludeProductId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM dbo.Products
        WHERE Sku = @Sku AND (@ExcludeProductId IS NULL OR Id <> @ExcludeProductId)
    ) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS ExistsFlag;
END
