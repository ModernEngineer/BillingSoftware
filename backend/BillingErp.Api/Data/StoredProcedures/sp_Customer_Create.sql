CREATE OR ALTER PROCEDURE dbo.sp_Customer_Create
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
    @PaymentTerms NVARCHAR(100) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @Status BIT = 1,
    @CustomerId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Customers
        (Name, Mobile, Email, Address, City, State, Pincode, Gstin, Pan,
         OpeningBalance, CreditLimit, PaymentTerms, Notes, Status, CreatedAt)
    VALUES
        (@Name, @Mobile, @Email, @Address, @City, @State, @Pincode, @Gstin, @Pan,
         @OpeningBalance, @CreditLimit, @PaymentTerms, @Notes, @Status, SYSUTCDATETIME());

    SET @CustomerId = SCOPE_IDENTITY();
END
