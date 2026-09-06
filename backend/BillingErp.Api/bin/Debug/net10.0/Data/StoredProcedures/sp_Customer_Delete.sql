-- Matches src/app/api/customers/[id]/route.ts's DELETE: deactivate (Status=0) if any Sale
-- references the customer, else hard-delete.
CREATE OR ALTER PROCEDURE dbo.sp_Customer_Delete
    @CustomerId INT,
    @Deactivated BIT OUTPUT,
    @CustomerName NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT @CustomerName = Name FROM dbo.Customers WHERE Id = @CustomerId;

    DECLARE @SaleCount INT;
    SELECT @SaleCount = COUNT(*) FROM dbo.Sales WHERE CustomerId = @CustomerId;

    IF @SaleCount > 0
    BEGIN
        UPDATE dbo.Customers SET Status = 0 WHERE Id = @CustomerId;
        SET @Deactivated = 1;
    END
    ELSE
    BEGIN
        DELETE FROM dbo.Customers WHERE Id = @CustomerId;
        SET @Deactivated = 0;
    END
END
