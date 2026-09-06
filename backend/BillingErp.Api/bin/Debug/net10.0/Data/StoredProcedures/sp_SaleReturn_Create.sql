-- @ItemsJson: [{"productId":1,"productName":"...","quantity":1,"rate":1,"total":1}]
CREATE OR ALTER PROCEDURE dbo.sp_SaleReturn_Create
    @SaleId INT,
    @Reason NVARCHAR(500),
    @RefundMethod NVARCHAR(50),
    @TotalAmount DECIMAL(18,2),
    @ItemsJson NVARCHAR(MAX),
    @CreatedById INT,
    @SaleReturnId INT OUTPUT,
    @ReturnNumber NVARCHAR(50) OUTPUT,
    @NotFound BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @CustomerId INT, @InvoiceNumber NVARCHAR(50);
    SELECT @CustomerId = CustomerId, @InvoiceNumber = InvoiceNumber FROM dbo.Sales WHERE Id = @SaleId;
    IF @@ROWCOUNT = 0
    BEGIN
        SET @NotFound = 1;
        RETURN;
    END
    SET @NotFound = 0;

    BEGIN TRAN;

    EXEC dbo.sp_Numbering_GetNext @Kind = 'SALE_RETURN', @Number = @ReturnNumber OUTPUT;

    INSERT INTO dbo.SaleReturns (ReturnNumber, SaleId, CustomerId, ReturnDate, Reason, TotalAmount, RefundMethod, CreatedById, CreatedAt)
    VALUES (@ReturnNumber, @SaleId, @CustomerId, SYSUTCDATETIME(), @Reason, @TotalAmount, @RefundMethod, @CreatedById, SYSUTCDATETIME());
    SET @SaleReturnId = SCOPE_IDENTITY();

    INSERT INTO dbo.SaleReturnItems (SaleReturnId, ProductId, ProductName, Quantity, Rate, Total)
    SELECT @SaleReturnId, ProductId, ProductName, Quantity, Rate, Total
    FROM OPENJSON(@ItemsJson) WITH (
        ProductId INT '$.productId', ProductName NVARCHAR(200) '$.productName',
        Quantity DECIMAL(18,2) '$.quantity', Rate DECIMAL(18,2) '$.rate', Total DECIMAL(18,2) '$.total'
    );

    DECLARE @Items TABLE (RowNum INT IDENTITY(1,1), ProductId INT, Quantity DECIMAL(18,2));
    INSERT INTO @Items (ProductId, Quantity)
    SELECT ProductId, Quantity FROM OPENJSON(@ItemsJson) WITH (ProductId INT '$.productId', Quantity DECIMAL(18,2) '$.quantity');

    DECLARE @i INT = 1, @Count INT = (SELECT COUNT(*) FROM @Items);
    DECLARE @PId INT, @PQty DECIMAL(18,2), @NB DECIMAL(18,2), @TxnId INT, @Note NVARCHAR(300) = CONCAT('Return against ', @InvoiceNumber);
    WHILE @i <= @Count
    BEGIN
        SELECT @PId = ProductId, @PQty = Quantity FROM @Items WHERE RowNum = @i;
        EXEC dbo.sp_Stock_RecordTransaction
            @ProductId = @PId, @Type = 'SALE_RETURN', @QuantityIn = @PQty,
            @ReferenceType = 'SALE_RETURN', @ReferenceId = @SaleReturnId, @Note = @Note, @CreatedById = @CreatedById,
            @NewBalance = @NB OUTPUT, @TransactionId = @TxnId OUTPUT;
        SET @i += 1;
    END

    COMMIT TRAN;
END
