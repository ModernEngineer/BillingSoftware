-- Partial update: any parameter left NULL keeps the column's existing value (COALESCE), matching
-- the original zod .optional() fields. Known simplification vs. the Prisma version: a nullable
-- column (CategoryId/BrandId/Mrp/MaximumStock/Barcode/HsnCode/Description/Image) can't be
-- explicitly cleared back to NULL through this procedure — only set to a new non-null value or
-- left untouched. Acceptable for now since no edit form actively clears these to blank.
CREATE OR ALTER PROCEDURE dbo.sp_Product_Update
    @ProductId INT,
    @Name NVARCHAR(200) = NULL,
    @Sku NVARCHAR(100) = NULL,
    @Barcode NVARCHAR(100) = NULL,
    @CategoryId INT = NULL,
    @BrandId INT = NULL,
    @UnitId INT = NULL,
    @HsnCode NVARCHAR(20) = NULL,
    @PurchasePrice DECIMAL(18,2) = NULL,
    @SellingPrice DECIMAL(18,2) = NULL,
    @Mrp DECIMAL(18,2) = NULL,
    @GstRate DECIMAL(18,2) = NULL,
    @MinimumStock DECIMAL(18,2) = NULL,
    @MaximumStock DECIMAL(18,2) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @Image NVARCHAR(500) = NULL,
    @StatusProvided BIT = 0,
    @Status BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Products
    SET Name = COALESCE(@Name, Name),
        Sku = COALESCE(@Sku, Sku),
        Barcode = COALESCE(@Barcode, Barcode),
        CategoryId = COALESCE(@CategoryId, CategoryId),
        BrandId = COALESCE(@BrandId, BrandId),
        UnitId = COALESCE(@UnitId, UnitId),
        HsnCode = COALESCE(@HsnCode, HsnCode),
        PurchasePrice = COALESCE(@PurchasePrice, PurchasePrice),
        SellingPrice = COALESCE(@SellingPrice, SellingPrice),
        Mrp = COALESCE(@Mrp, Mrp),
        GstRate = COALESCE(@GstRate, GstRate),
        MinimumStock = COALESCE(@MinimumStock, MinimumStock),
        MaximumStock = COALESCE(@MaximumStock, MaximumStock),
        Description = COALESCE(@Description, Description),
        Image = COALESCE(@Image, Image),
        Status = CASE WHEN @StatusProvided = 1 THEN @Status ELSE Status END,
        UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @ProductId;
END
