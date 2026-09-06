CREATE OR ALTER PROCEDURE dbo.sp_Bom_Create
    @FinishedProductId INT,
    @ComponentProductId INT,
    @Quantity DECIMAL(18,2),
    @BOMItemId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.BOMItems (FinishedProductId, ComponentProductId, Quantity)
    VALUES (@FinishedProductId, @ComponentProductId, @Quantity);

    SET @BOMItemId = SCOPE_IDENTITY();
END
