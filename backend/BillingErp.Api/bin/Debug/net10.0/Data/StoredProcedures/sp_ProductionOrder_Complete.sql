-- Ports production-orders/[id]/complete/route.ts's core logic. Stock-sufficiency checks against
-- the *current* balance are done by the controller before calling this procedure (same layering
-- as sp_Sale_Create's pre-check loop via sp_Stock_GetBalance) — this procedure performs the
-- atomic write only: per component, a PRODUCTION_OUT stock transaction + a ProductionConsumption
-- row, then a single PRODUCTION_IN stock transaction for the finished good, then marks the order
-- COMPLETED with an EndDate. All amounts (@ComponentsJson[].Required) are already computed by the
-- caller as BOM.Quantity (per unit of finished good) * order.Quantity — the BOM-explosion math
-- itself lives in the controller so it's easy to unit-review; this procedure just executes it.
-- @ComponentsJson: [{"componentProductId":2,"required":5.00}]
CREATE OR ALTER PROCEDURE dbo.sp_ProductionOrder_Complete
    @OrderId INT,
    @ComponentsJson NVARCHAR(MAX),
    @CreatedById INT,
    @NotFound BIT OUTPUT,
    @AlreadyCompleted BIT OUTPUT,
    @OrderNumber NVARCHAR(50) OUTPUT,
    @ProductId INT OUTPUT,
    @Quantity DECIMAL(18,2) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @NotFound = 0;
    SET @AlreadyCompleted = 0;

    BEGIN TRAN;

    DECLARE @Status NVARCHAR(20);
    SELECT @OrderNumber = OrderNumber, @ProductId = ProductId, @Quantity = Quantity, @Status = Status
    FROM dbo.ProductionOrders WITH (UPDLOCK, HOLDLOCK)
    WHERE Id = @OrderId;

    IF @OrderNumber IS NULL
    BEGIN
        SET @NotFound = 1;
        ROLLBACK TRAN;
        RETURN;
    END

    IF @Status = 'COMPLETED'
    BEGIN
        SET @AlreadyCompleted = 1;
        ROLLBACK TRAN;
        RETURN;
    END

    DECLARE @Components TABLE (RowNum INT IDENTITY(1,1), ComponentProductId INT, Required DECIMAL(18,2));
    INSERT INTO @Components (ComponentProductId, Required)
    SELECT ComponentProductId, Required
    FROM OPENJSON(@ComponentsJson) WITH (
        ComponentProductId INT '$.componentProductId',
        Required DECIMAL(18,2) '$.required'
    );

    DECLARE @i INT = 1, @CompCount INT = (SELECT COUNT(*) FROM @Components);
    DECLARE @CId INT, @CReq DECIMAL(18,2), @NB DECIMAL(18,2), @TxnId INT;
    DECLARE @ConsumeNote NVARCHAR(300) = CONCAT('Consumed for ', @OrderNumber);
    WHILE @i <= @CompCount
    BEGIN
        SELECT @CId = ComponentProductId, @CReq = Required FROM @Components WHERE RowNum = @i;

        EXEC dbo.sp_Stock_RecordTransaction
            @ProductId = @CId, @Type = 'PRODUCTION_OUT', @QuantityOut = @CReq,
            @ReferenceType = 'PRODUCTION_ORDER', @ReferenceId = @OrderId, @Note = @ConsumeNote,
            @CreatedById = @CreatedById,
            @NewBalance = @NB OUTPUT, @TransactionId = @TxnId OUTPUT;

        INSERT INTO dbo.ProductionConsumptions (ProductionOrderId, ComponentProductId, QuantityConsumed)
        VALUES (@OrderId, @CId, @CReq);

        SET @i += 1;
    END

    DECLARE @ProduceNote NVARCHAR(300) = CONCAT('Produced via ', @OrderNumber);
    EXEC dbo.sp_Stock_RecordTransaction
        @ProductId = @ProductId, @Type = 'PRODUCTION_IN', @QuantityIn = @Quantity,
        @ReferenceType = 'PRODUCTION_ORDER', @ReferenceId = @OrderId, @Note = @ProduceNote,
        @CreatedById = @CreatedById,
        @NewBalance = @NB OUTPUT, @TransactionId = @TxnId OUTPUT;

    UPDATE dbo.ProductionOrders SET Status = 'COMPLETED', EndDate = SYSUTCDATETIME() WHERE Id = @OrderId;

    COMMIT TRAN;
END
