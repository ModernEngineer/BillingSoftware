-- Partial update via COALESCE, same pattern as sp_Product_Update. OpeningBalance/CreditLimit use
-- @...Provided flags too since 0 (or an explicit null-out of CreditLimit) is a legitimate value
-- that COALESCE alone couldn't distinguish from "not sent".
CREATE OR ALTER PROCEDURE dbo.sp_Customer_Update
    @CustomerId INT,
    @Name NVARCHAR(200) = NULL,
    @Mobile NVARCHAR(20) = NULL,
    @Email NVARCHAR(200) = NULL,
    @Address NVARCHAR(MAX) = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(100) = NULL,
    @Pincode NVARCHAR(20) = NULL,
    @Gstin NVARCHAR(20) = NULL,
    @Pan NVARCHAR(20) = NULL,
    @OpeningBalanceProvided BIT = 0,
    @OpeningBalance DECIMAL(18,2) = 0,
    @CreditLimit DECIMAL(18,2) = NULL,
    @PaymentTerms NVARCHAR(100) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @StatusProvided BIT = 0,
    @Status BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Customers
    SET Name = COALESCE(@Name, Name),
        Mobile = COALESCE(@Mobile, Mobile),
        Email = COALESCE(@Email, Email),
        Address = COALESCE(@Address, Address),
        City = COALESCE(@City, City),
        State = COALESCE(@State, State),
        Pincode = COALESCE(@Pincode, Pincode),
        Gstin = COALESCE(@Gstin, Gstin),
        Pan = COALESCE(@Pan, Pan),
        OpeningBalance = CASE WHEN @OpeningBalanceProvided = 1 THEN @OpeningBalance ELSE OpeningBalance END,
        CreditLimit = COALESCE(@CreditLimit, CreditLimit),
        PaymentTerms = COALESCE(@PaymentTerms, PaymentTerms),
        Notes = COALESCE(@Notes, Notes),
        Status = CASE WHEN @StatusProvided = 1 THEN @Status ELSE Status END
    WHERE Id = @CustomerId;
END
