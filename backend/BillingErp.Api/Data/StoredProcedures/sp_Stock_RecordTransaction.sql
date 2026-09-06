CREATE OR ALTER PROCEDURE dbo.sp_Stock_RecordTransaction
    @ProductId INT,
    @Type NVARCHAR(30),
    @QuantityIn DECIMAL(18,2) = 0,
    @QuantityOut DECIMAL(18,2) = 0,
    @ReferenceType NVARCHAR(30) = NULL,
    @ReferenceId INT = NULL,
    @Note NVARCHAR(500) = NULL,
    @CreatedById INT,
    @NewBalance DECIMAL(18,2) OUTPUT,
    @TransactionId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRAN;

    DECLARE @PriorBalance DECIMAL(18,2);
    SELECT @PriorBalance = COALESCE(SUM(QuantityIn), 0) - COALESCE(SUM(QuantityOut), 0)
    FROM dbo.StockTransactions WITH (UPDLOCK, HOLDLOCK)
    WHERE ProductId = @ProductId;

    SET @NewBalance = COALESCE(@PriorBalance, 0) + @QuantityIn - @QuantityOut;

    INSERT INTO dbo.StockTransactions (ProductId, Type, QuantityIn, QuantityOut, Balance, ReferenceType, ReferenceId, Note, CreatedById, CreatedAt)
    VALUES (@ProductId, @Type, @QuantityIn, @QuantityOut, @NewBalance, @ReferenceType, @ReferenceId, @Note, @CreatedById, SYSUTCDATETIME());

    SET @TransactionId = SCOPE_IDENTITY();

    COMMIT TRAN;
END
