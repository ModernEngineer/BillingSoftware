-- The BOM-exists check happens in the controller (ProductionOrdersController calls
-- sp_Bom_ListByFinishedProduct first), same layering as sp_Sale_Create's stock-availability
-- check. This procedure owns the order-number allocation + insert as one atomic unit.
CREATE OR ALTER PROCEDURE dbo.sp_ProductionOrder_Create
    @ProductId INT,
    @Quantity DECIMAL(18,2),
    @Notes NVARCHAR(MAX) = NULL,
    @CreatedById INT,
    @OrderId INT OUTPUT,
    @OrderNumber NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRAN;

    EXEC dbo.sp_Numbering_GetNext @Kind = 'PRODUCTION', @Number = @OrderNumber OUTPUT;

    INSERT INTO dbo.ProductionOrders (OrderNumber, ProductId, Quantity, Status, Notes, CreatedById, CreatedAt)
    VALUES (@OrderNumber, @ProductId, @Quantity, 'PLANNED', @Notes, @CreatedById, SYSUTCDATETIME());

    SET @OrderId = SCOPE_IDENTITY();

    COMMIT TRAN;
END
