-- @ItemsJson: [{"productId":1,"productName":"...","quantity":1,"rate":1,"total":1}]
CREATE OR ALTER PROCEDURE dbo.sp_PurchaseReturn_Create
    @PurchaseId INT,
    @Reason NVARCHAR(500),
    @TotalAmount DECIMAL(18,2),
    @ItemsJson NVARCHAR(MAX),
    @CreatedById INT,
    @PurchaseReturnId INT OUTPUT,
    @ReturnNumber NVARCHAR(50) OUTPUT,
    @NotFound BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @SupplierId INT, @PurchaseNumber NVARCHAR(50);
    SELECT @SupplierId = SupplierId, @PurchaseNumber = PurchaseNumber FROM dbo.Purchases WHERE Id = @PurchaseId;
    IF @@ROWCOUNT = 0
    BEGIN
        SET @NotFound = 1;
        RETURN;
    END
    SET @NotFound = 0;

    BEGIN TRAN;

    EXEC dbo.sp_Numbering_GetNext @Kind = 'PURCHASE_RETURN', @Number = @ReturnNumber OUTPUT;

    INSERT INTO dbo.PurchaseReturns (ReturnNumber, PurchaseId, SupplierId, ReturnDate, Reason, TotalAmount, CreatedById, CreatedAt)
    VALUES (@ReturnNumber, @PurchaseId, @SupplierId, SYSUTCDATETIME(), @Reason, @TotalAmount, @CreatedById, SYSUTCDATETIME());
    SET @PurchaseReturnId = SCOPE_IDENTITY();

    INSERT INTO dbo.PurchaseReturnItems (PurchaseReturnId, ProductId, ProductName, Quantity, Rate, Total)
    SELECT @PurchaseReturnId, ProductId, ProductName, Quantity, Rate, Total
    FROM OPENJSON(@ItemsJson) WITH (
        ProductId INT '$.productId', ProductName NVARCHAR(200) '$.productName',
        Quantity DECIMAL(18,2) '$.quantity', Rate DECIMAL(18,2) '$.rate', Total DECIMAL(18,2) '$.total'
    );

    DECLARE @Items TABLE (RowNum INT IDENTITY(1,1), ProductId INT, Quantity DECIMAL(18,2));
    INSERT INTO @Items (ProductId, Quantity)
    SELECT ProductId, Quantity FROM OPENJSON(@ItemsJson) WITH (ProductId INT '$.productId', Quantity DECIMAL(18,2) '$.quantity');

    DECLARE @i INT = 1, @Count INT = (SELECT COUNT(*) FROM @Items);
    DECLARE @PId INT, @PQty DECIMAL(18,2), @NB DECIMAL(18,2), @TxnId INT, @Note NVARCHAR(300) = CONCAT('Return against ', @PurchaseNumber);
    WHILE @i <= @Count
    BEGIN
        SELECT @PId = ProductId, @PQty = Quantity FROM @Items WHERE RowNum = @i;
        EXEC dbo.sp_Stock_RecordTransaction
            @ProductId = @PId, @Type = 'PURCHASE_RETURN', @QuantityOut = @PQty,
            @ReferenceType = 'PURCHASE_RETURN', @ReferenceId = @PurchaseReturnId, @Note = @Note, @CreatedById = @CreatedById,
            @NewBalance = @NB OUTPUT, @TransactionId = @TxnId OUTPUT;
        SET @i += 1;
    END

    COMMIT TRAN;
END
