-- Same rationale as sp_Customer_GetById: no GET /api/suppliers/[id] in the original route set
-- (only PATCH/DELETE + a separate /ledger route out of scope here); this backs Create/Update's
-- response re-fetch.
CREATE OR ALTER PROCEDURE dbo.sp_Supplier_GetById
    @SupplierId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        Id, Name, Mobile, Email, Address, City, State, Pincode, Gstin, Pan,
        OpeningBalance, CreditLimit, Notes, Status, CreatedAt
    FROM dbo.Suppliers
    WHERE Id = @SupplierId;
END
