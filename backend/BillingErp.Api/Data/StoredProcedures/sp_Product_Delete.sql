CREATE OR ALTER PROCEDURE dbo.sp_Product_Delete
    @ProductId INT,
    @Deactivated BIT OUTPUT,
    @ProductName NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT @ProductName = Name FROM dbo.Products WHERE Id = @ProductId;

    -- The original Next.js/Prisma route only checked SaleItem/PurchaseItem counts here, which
    -- left a latent bug: a brand-new product with only an OPENING stock transaction (the normal
    -- case whenever it's created with opening stock > 0) would still hard-delete-attempt and hit
    -- a FK violation against StockTransactions. Broadened to match CLAUDE.md's own stated
    -- convention ("never hard-deletes if the record has related transactions") rather than
    -- reproducing the incomplete check.
    DECLARE @SaleItemCount INT, @PurchaseItemCount INT, @StockTxnCount INT;
    SELECT @SaleItemCount = COUNT(*) FROM dbo.SaleItems WHERE ProductId = @ProductId;
    SELECT @PurchaseItemCount = COUNT(*) FROM dbo.PurchaseItems WHERE ProductId = @ProductId;
    SELECT @StockTxnCount = COUNT(*) FROM dbo.StockTransactions WHERE ProductId = @ProductId;

    IF @SaleItemCount > 0 OR @PurchaseItemCount > 0 OR @StockTxnCount > 0
    BEGIN
        UPDATE dbo.Products SET Status = 0, UpdatedAt = SYSUTCDATETIME() WHERE Id = @ProductId;
        SET @Deactivated = 1;
    END
    ELSE
    BEGIN
        DELETE FROM dbo.Products WHERE Id = @ProductId;
        SET @Deactivated = 0;
    END
END
