CREATE OR ALTER PROCEDURE dbo.sp_Import_Supplier_Create
    @Name NVARCHAR(200),
    @Mobile NVARCHAR(50),
    @Email NVARCHAR(200) = NULL,
    @Address NVARCHAR(500) = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(100) = NULL,
    @Pincode NVARCHAR(20) = NULL,
    @Gstin NVARCHAR(20) = NULL,
    @OpeningBalance DECIMAL(18,2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Suppliers (Name, Mobile, Email, Address, City, State, Pincode, Gstin, OpeningBalance, Status, CreatedAt)
    VALUES (@Name, @Mobile, @Email, @Address, @City, @State, @Pincode, @Gstin, @OpeningBalance, 1, SYSUTCDATETIME());
END
