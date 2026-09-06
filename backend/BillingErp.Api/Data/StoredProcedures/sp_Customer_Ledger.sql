-- 3 result sets: 1) confirmed sales, 2) RECEIVE payments, 3) sale returns — all for one customer.
-- The running-balance math is done in C# (mirrors src/lib/ledger.ts's withRunningBalance).
CREATE OR ALTER PROCEDURE dbo.sp_Customer_Ledger
    @CustomerId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT InvoiceDate AS Date, InvoiceNumber AS Reference, GrandTotal AS Amount
    FROM dbo.Sales
    WHERE CustomerId = @CustomerId AND Status = 'CONFIRMED';

    SELECT Date, PaymentNumber AS Reference, Amount
    FROM dbo.Payments
    WHERE CustomerId = @CustomerId AND Direction = 'RECEIVE';

    SELECT ReturnDate AS Date, ReturnNumber AS Reference, TotalAmount AS Amount
    FROM dbo.SaleReturns
    WHERE CustomerId = @CustomerId;
END
