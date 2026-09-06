-- Used by ProductionOrdersController for both Create's "does a BOM exist" check and Complete's
-- BOM-explosion (per-unit Quantity * order Quantity) stock check.
CREATE OR ALTER PROCEDURE dbo.sp_Bom_ListByFinishedProduct
    @FinishedProductId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT b.Id, b.FinishedProductId, b.ComponentProductId, cp.Name AS ComponentProductName, b.Quantity
    FROM dbo.BOMItems b
    JOIN dbo.Products cp ON cp.Id = b.ComponentProductId
    WHERE b.FinishedProductId = @FinishedProductId;
END
