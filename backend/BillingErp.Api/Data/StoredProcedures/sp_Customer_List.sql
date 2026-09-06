-- Mirrors src/app/api/customers/route.ts's GET: per-customer totals aggregated only over
-- CONFIRMED sales, with `due` = summed DueAmount + the customer's own OpeningBalance.
CREATE OR ALTER PROCEDURE dbo.sp_Customer_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.Id, c.Name, c.Mobile, c.Email, c.Address, c.City, c.State, c.Pincode, c.Gstin, c.Pan,
        c.OpeningBalance, c.CreditLimit, c.PaymentTerms, c.Notes, c.Status, c.CreatedAt,
        COALESCE(sa.TotalSales, 0) AS TotalSales,
        COALESCE(sa.Paid, 0) AS Paid,
        COALESCE(sa.Due, 0) + c.OpeningBalance AS Due
    FROM dbo.Customers c
    OUTER APPLY (
        SELECT SUM(s.GrandTotal) AS TotalSales, SUM(s.PaidAmount) AS Paid, SUM(s.DueAmount) AS Due
        FROM dbo.Sales s
        WHERE s.CustomerId = c.Id AND s.Status = 'CONFIRMED'
    ) sa
    ORDER BY c.Name ASC;
END
