CREATE OR ALTER PROCEDURE dbo.sp_Payment_Receive
    @CustomerId INT,
    @SaleId INT,
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

    DECLARE @SaleCustomerId INT, @SalePaid DECIMAL(18,2), @SaleGrand DECIMAL(18,2);
    SELECT @SaleCustomerId = CustomerId, @SalePaid = PaidAmount, @SaleGrand = GrandTotal, @DueAmount = DueAmount
    FROM dbo.Sales WHERE Id = @SaleId;

    IF @@ROWCOUNT = 0 OR @SaleCustomerId IS NULL OR @SaleCustomerId <> @CustomerId
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
    INSERT INTO dbo.Payments (PaymentNumber, Direction, Date, Amount, Method, ReferenceNo, Notes, CustomerId, SaleId, CreatedById, CreatedAt)
    VALUES (@PaymentNumber, 'RECEIVE', @Date, @Amount, @Method, @ReferenceNo, @Notes, @CustomerId, @SaleId, @CreatedById, @CreatedAt);
    SET @PaymentId = SCOPE_IDENTITY();

    DECLARE @NewPaid DECIMAL(18,2) = @SalePaid + @Amount;
    DECLARE @NewDue DECIMAL(18,2) = CASE WHEN @SaleGrand - @NewPaid < 0 THEN 0 ELSE @SaleGrand - @NewPaid END;
    UPDATE dbo.Sales
    SET PaidAmount = @NewPaid,
        DueAmount = @NewDue,
        PaymentStatus = CASE WHEN @NewDue <= 0 THEN 'PAID' WHEN @NewPaid > 0 THEN 'PARTIAL' ELSE 'DUE' END
    WHERE Id = @SaleId;

    COMMIT TRAN;
END
