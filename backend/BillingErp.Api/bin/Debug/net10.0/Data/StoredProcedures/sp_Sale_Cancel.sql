-- Matches the original's behavior exactly: only flips Status/CancelReason and reverses stock
-- (as an ADJUSTMENT-type stock transaction) — does NOT touch PaidAmount/DueAmount/PaymentStatus
-- or create a refund Payment.
CREATE OR ALTER PROCEDURE dbo.sp_Sale_Cancel
    @SaleId INT,
    @Reason NVARCHAR(500),
    @CreatedById INT,
    @NotFound BIT OUTPUT,
    @AlreadyCancelled BIT OUTPUT,
    @InvoiceNumber NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @NotFound = 0;
    SET @AlreadyCancelled = 0;

    DECLARE @CurrentStatus NVARCHAR(20);
    SELECT @InvoiceNumber = InvoiceNumber, @CurrentStatus = Status FROM dbo.Sales WHERE Id = @SaleId;
    IF @@ROWCOUNT = 0
    BEGIN
        SET @NotFound = 1;
        RETURN;
    END
    IF @CurrentStatus = 'CANCELLED'
    BEGIN
        SET @AlreadyCancelled = 1;
        RETURN;
    END

    BEGIN TRAN;

    UPDATE dbo.Sales SET Status = 'CANCELLED', CancelReason = @Reason WHERE Id = @SaleId;

    DECLARE @Items TABLE (RowNum INT IDENTITY(1,1), ProductId INT, Quantity DECIMAL(18,2));
    INSERT INTO @Items (ProductId, Quantity) SELECT ProductId, Quantity FROM dbo.SaleItems WHERE SaleId = @SaleId;

    DECLARE @i INT = 1, @Count INT = (SELECT COUNT(*) FROM @Items);
    DECLARE @PId INT, @PQty DECIMAL(18,2), @NB DECIMAL(18,2), @TxnId INT;
    DECLARE @Note NVARCHAR(300) = CONCAT('Reversal for cancelled invoice ', @InvoiceNumber);
    WHILE @i <= @Count
    BEGIN
        SELECT @PId = ProductId, @PQty = Quantity FROM @Items WHERE RowNum = @i;
        EXEC dbo.sp_Stock_RecordTransaction
            @ProductId = @PId, @Type = 'ADJUSTMENT', @QuantityIn = @PQty,
            @ReferenceType = 'SALE_CANCEL', @ReferenceId = @SaleId, @Note = @Note, @CreatedById = @CreatedById,
            @NewBalance = @NB OUTPUT, @TransactionId = @TxnId OUTPUT;
        SET @i += 1;
    END

    COMMIT TRAN;
END
