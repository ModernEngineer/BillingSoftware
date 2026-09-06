CREATE OR ALTER PROCEDURE dbo.sp_Product_Create
    @Name NVARCHAR(200),
    @Sku NVARCHAR(100),
    @Barcode NVARCHAR(100) = NULL,
    @CategoryId INT = NULL,
    @BrandId INT = NULL,
    @UnitId INT,
    @HsnCode NVARCHAR(20) = NULL,
    @PurchasePrice DECIMAL(18,2),
    @SellingPrice DECIMAL(18,2),
    @Mrp DECIMAL(18,2) = NULL,
    @GstRate DECIMAL(18,2) = 0,
    @OpeningStock DECIMAL(18,2) = 0,
    @MinimumStock DECIMAL(18,2) = 0,
    @MaximumStock DECIMAL(18,2) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @Image NVARCHAR(500) = NULL,
    @Status BIT = 1,
    @CreatedById INT,
    @ProductId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRAN;

    INSERT INTO dbo.Products
        (Name, Sku, Barcode, CategoryId, BrandId, UnitId, HsnCode, PurchasePrice, SellingPrice, Mrp,
         GstRate, OpeningStock, MinimumStock, MaximumStock, Description, Image, Status, CreatedAt, UpdatedAt)
    VALUES
        (@Name, @Sku, @Barcode, @CategoryId, @BrandId, @UnitId, @HsnCode, @PurchasePrice, @SellingPrice, @Mrp,
         @GstRate, @OpeningStock, @MinimumStock, @MaximumStock, @Description, @Image, @Status, SYSUTCDATETIME(), SYSUTCDATETIME());

    SET @ProductId = SCOPE_IDENTITY();

    IF @OpeningStock > 0
    BEGIN
        DECLARE @NewBalance DECIMAL(18,2), @TxnId INT;
        EXEC dbo.sp_Stock_RecordTransaction
            @ProductId = @ProductId, @Type = 'OPENING',
            @QuantityIn = @OpeningStock, @QuantityOut = 0,
            @ReferenceType = NULL, @ReferenceId = NULL, @Note = 'Opening stock',
            @CreatedById = @CreatedById,
            @NewBalance = @NewBalance OUTPUT, @TransactionId = @TxnId OUTPUT;
    END

    COMMIT TRAN;
END
