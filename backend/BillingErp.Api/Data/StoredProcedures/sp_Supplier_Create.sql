CREATE OR ALTER PROCEDURE dbo.sp_Supplier_Create
    @Name NVARCHAR(200),
    @Mobile NVARCHAR(20),
    @Email NVARCHAR(200) = NULL,
    @Address NVARCHAR(MAX) = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(100) = NULL,
    @Pincode NVARCHAR(20) = NULL,
    @Gstin NVARCHAR(20) = NULL,
    @Pan NVARCHAR(20) = NULL,
    @OpeningBalance DECIMAL(18,2) = 0,
    @CreditLimit DECIMAL(18,2) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @Status BIT = 1,
    @SupplierId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Suppliers
        (Name, Mobile, Email, Address, City, State, Pincode, Gstin, Pan,
         OpeningBalance, CreditLimit, Notes, Status, CreatedAt)
    VALUES
        (@Name, @Mobile, @Email, @Address, @City, @State, @Pincode, @Gstin, @Pan,
         @OpeningBalance, @CreditLimit, @Notes, @Status, SYSUTCDATETIME());

    SET @SupplierId = SCOPE_IDENTITY();
END
