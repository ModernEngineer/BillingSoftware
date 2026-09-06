CREATE OR ALTER PROCEDURE dbo.sp_Payment_Pay
    @SupplierId INT,
    @PurchaseId INT,
    @Amount DECIMAL(18,2),
    @Method NVARCHAR(20),
    @Date DATETIME2,
    @ReferenceNo NVARCHAR(100) = NULL,
    @Notes NVARCHAR(500) = NULL,
    @CreatedById INT,
    @PaymentId INT OUTPUT,
    @PaymentNumber NVARCHAR(50) OUTPUT,
    @NotFound BIT OUTPUT,
    @ExceedsDue BIT OUTPUT,
    @DueAmount DECIMAL(18,2) OUTPUT,
    @CreatedAt DATETIME2 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @PurchaseSupplierId INT, @PurchasePaid DECIMAL(18,2), @PurchaseGrand DECIMAL(18,2);
    SELECT @PurchaseSupplierId = SupplierId, @PurchasePaid = PaidAmount, @PurchaseGrand = GrandTotal, @DueAmount = DueAmount
    FROM dbo.Purchases WHERE Id = @PurchaseId;

    IF @@ROWCOUNT = 0 OR @PurchaseSupplierId <> @SupplierId
    BEGIN
        SET @NotFound = 1;
        SET @ExceedsDue = 0;
        RETURN;
    END
    SET @NotFound = 0;

    IF @Amount > @DueAmount
    BEGIN
        SET @ExceedsDue = 1;
        RETURN;
    END
    SET @ExceedsDue = 0;

    BEGIN TRAN;

    EXEC dbo.sp_Numbering_GetNext @Kind = 'PAYMENT', @Number = @PaymentNumber OUTPUT;

    SET @CreatedAt = SYSUTCDATETIME();
    INSERT INTO dbo.Payments (PaymentNumber, Direction, Date, Amount, Method, ReferenceNo, Notes, SupplierId, PurchaseId, CreatedById, CreatedAt)
    VALUES (@PaymentNumber, 'PAY', @Date, @Amount, @Method, @ReferenceNo, @Notes, @SupplierId, @PurchaseId, @CreatedById, @CreatedAt);
    SET @PaymentId = SCOPE_IDENTITY();

    DECLARE @NewPaid DECIMAL(18,2) = @PurchasePaid + @Amount;
    DECLARE @NewDue DECIMAL(18,2) = CASE WHEN @PurchaseGrand - @NewPaid < 0 THEN 0 ELSE @PurchaseGrand - @NewPaid END;
    UPDATE dbo.Purchases
    SET PaidAmount = @NewPaid,
        DueAmount = @NewDue,
        PaymentStatus = CASE WHEN @NewDue <= 0 THEN 'PAID' WHEN @NewPaid > 0 THEN 'PARTIAL' ELSE 'DUE' END
    WHERE Id = @PurchaseId;

    COMMIT TRAN;
END
