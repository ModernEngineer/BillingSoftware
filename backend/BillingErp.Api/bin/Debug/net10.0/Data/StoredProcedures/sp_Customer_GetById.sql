-- The original route has no GET /api/customers/[id] (only PATCH/DELETE + a separate /ledger
-- route out of scope here) — this SP exists so Create/Update can re-fetch the row for the
-- response body, matching the rest of the pattern; it returns the same plain columns without
-- the sales aggregation (no list-page totals needed for a single-record response).
CREATE OR ALTER PROCEDURE dbo.sp_Customer_GetById
    @CustomerId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        Id, Name, Mobile, Email, Address, City, State, Pincode, Gstin, Pan,
        OpeningBalance, CreditLimit, PaymentTerms, Notes, Status, CreatedAt
    FROM dbo.Customers
    WHERE Id = @CustomerId;
END
