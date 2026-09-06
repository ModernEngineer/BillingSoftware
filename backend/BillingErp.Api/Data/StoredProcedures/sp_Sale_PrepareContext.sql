-- Self-contained lookup used only by sp_Sale_Create's caller (avoids depending on the separate
-- Customers CRUD module's stored procedures). Returns the single Business row's State and, if a
-- customer id is given, that Customer's State + whether the Customer exists at all.
CREATE OR ALTER PROCEDURE dbo.sp_Sale_PrepareContext
    @CustomerId INT = NULL,
    @BusinessState NVARCHAR(100) OUTPUT,
    @CustomerState NVARCHAR(100) OUTPUT,
    @CustomerExists BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 @BusinessState = State FROM dbo.Businesses;

    IF @CustomerId IS NULL
    BEGIN
        SET @CustomerExists = 1; -- "no customer selected" is valid (walk-in sale)
        SET @CustomerState = NULL;
    END
    ELSE
    BEGIN
        SELECT @CustomerState = State FROM dbo.Customers WHERE Id = @CustomerId;
        SET @CustomerExists = CASE WHEN @@ROWCOUNT > 0 THEN 1 ELSE 0 END;
    END
END
