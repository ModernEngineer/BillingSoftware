-- Mirrors sp_Sale_PrepareContext for the Supplier side.
CREATE OR ALTER PROCEDURE dbo.sp_Purchase_PrepareContext
    @SupplierId INT,
    @BusinessState NVARCHAR(100) OUTPUT,
    @SupplierState NVARCHAR(100) OUTPUT,
    @SupplierExists BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 @BusinessState = State FROM dbo.Businesses;

    SELECT @SupplierState = State FROM dbo.Suppliers WHERE Id = @SupplierId;
    SET @SupplierExists = CASE WHEN @@ROWCOUNT > 0 THEN 1 ELSE 0 END;
END
