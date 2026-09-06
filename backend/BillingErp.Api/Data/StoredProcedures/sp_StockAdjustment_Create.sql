CREATE OR ALTER PROCEDURE dbo.sp_StockAdjustment_Create
    @ProductId INT,
    @AdjustmentType NVARCHAR(20),
    @Quantity DECIMAL(18,2),
    @Reason NVARCHAR(500),
    @Note NVARCHAR(500) = NULL,
    @CreatedById INT,
    @AdjustmentId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRAN;

    INSERT INTO dbo.StockAdjustments (ProductId, AdjustmentType, Quantity, Reason, Note, CreatedById, CreatedAt)
    VALUES (@ProductId, @AdjustmentType, @Quantity, @Reason, @Note, @CreatedById, SYSUTCDATETIME());
    SET @AdjustmentId = SCOPE_IDENTITY();

    DECLARE @NB DECIMAL(18,2), @TxnId INT;
    DECLARE @QtyIn DECIMAL(18,2) = CASE WHEN @AdjustmentType = 'INCREASE' THEN @Quantity ELSE 0 END;
    DECLARE @QtyOut DECIMAL(18,2) = CASE WHEN @AdjustmentType = 'DECREASE' THEN @Quantity ELSE 0 END;
    EXEC dbo.sp_Stock_RecordTransaction
        @ProductId = @ProductId, @Type = 'ADJUSTMENT',
        @QuantityIn = @QtyIn, @QuantityOut = @QtyOut,
        @ReferenceType = 'STOCK_ADJUSTMENT', @ReferenceId = @AdjustmentId, @Note = @Reason, @CreatedById = @CreatedById,
        @NewBalance = @NB OUTPUT, @TransactionId = @TxnId OUTPUT;

    COMMIT TRAN;
END
