-- Matches src/app/api/suppliers/[id]/route.ts's DELETE: deactivate (Status=0) if any Purchase
-- references the supplier, else hard-delete.
CREATE OR ALTER PROCEDURE dbo.sp_Supplier_Delete
    @SupplierId INT,
    @Deactivated BIT OUTPUT,
    @SupplierName NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT @SupplierName = Name FROM dbo.Suppliers WHERE Id = @SupplierId;

    DECLARE @PurchaseCount INT;
    SELECT @PurchaseCount = COUNT(*) FROM dbo.Purchases WHERE SupplierId = @SupplierId;

    IF @PurchaseCount > 0
    BEGIN
        UPDATE dbo.Suppliers SET Status = 0 WHERE Id = @SupplierId;
        SET @Deactivated = 1;
    END
    ELSE
    BEGIN
        DELETE FROM dbo.Suppliers WHERE Id = @SupplierId;
        SET @Deactivated = 0;
    END
END
