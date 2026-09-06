-- 3 result sets: 1) KPIs (one row), 2) daily trend (Day, Sales, Purchase) for the requested
-- range, 3) payment breakdown by method (RECEIVE only) for the requested range.
CREATE OR ALTER PROCEDURE dbo.sp_Dashboard_Summary
    @TodayFrom DATETIME2,
    @TodayTo DATETIME2,
    @MonthStart DATETIME2,
    @RangeFrom DATETIME2,
    @RangeTo DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TodaySales DECIMAL(18,2), @TodayPurchase DECIMAL(18,2), @TotalReceivable DECIMAL(18,2), @TotalPayable DECIMAL(18,2);
    DECLARE @TotalProducts INT, @TotalCustomers INT, @MonthlySales DECIMAL(18,2), @MonthlyExpenses DECIMAL(18,2);
    DECLARE @TodayTaxable DECIMAL(18,2), @TodayCogs DECIMAL(18,2), @TodayExpense DECIMAL(18,2), @TodayProfit DECIMAL(18,2);
    DECLARE @LowStockCount INT;

    SELECT @TodaySales = COALESCE(SUM(GrandTotal), 0) FROM dbo.Sales WHERE Status = 'CONFIRMED' AND InvoiceDate >= @TodayFrom AND InvoiceDate <= @TodayTo;
    SELECT @TodayPurchase = COALESCE(SUM(GrandTotal), 0) FROM dbo.Purchases WHERE Status = 'CONFIRMED' AND PurchaseDate >= @TodayFrom AND PurchaseDate <= @TodayTo;
    SELECT @TotalReceivable = COALESCE(SUM(DueAmount), 0) FROM dbo.Sales WHERE Status = 'CONFIRMED';
    SELECT @TotalPayable = COALESCE(SUM(DueAmount), 0) FROM dbo.Purchases WHERE Status = 'CONFIRMED';
    SELECT @TotalProducts = COUNT(*) FROM dbo.Products WHERE Status = 1;
    SELECT @TotalCustomers = COUNT(*) FROM dbo.Customers WHERE Status = 1;
    SELECT @MonthlySales = COALESCE(SUM(GrandTotal), 0) FROM dbo.Sales WHERE InvoiceDate >= @MonthStart;
    SELECT @MonthlyExpenses = COALESCE(SUM(Amount), 0) FROM dbo.Expenses WHERE Date >= @MonthStart;
    SELECT @TodayExpense = COALESCE(SUM(Amount), 0) FROM dbo.Expenses WHERE Date >= @TodayFrom AND Date <= @TodayTo;
    SELECT @TodayTaxable = COALESCE(SUM(TaxableAmount), 0) FROM dbo.Sales WHERE Status = 'CONFIRMED' AND InvoiceDate >= @TodayFrom AND InvoiceDate <= @TodayTo;

    SELECT @TodayCogs = COALESCE(SUM(si.Quantity * p.PurchasePrice), 0)
    FROM dbo.Sales s
    JOIN dbo.SaleItems si ON si.SaleId = s.Id
    JOIN dbo.Products p ON p.Id = si.ProductId
    WHERE s.Status = 'CONFIRMED' AND s.InvoiceDate >= @TodayFrom AND s.InvoiceDate <= @TodayTo;

    SET @TodayProfit = (@TodayTaxable - @TodayCogs) - @TodayExpense;

    SELECT @LowStockCount = COUNT(*)
    FROM dbo.Products p
    OUTER APPLY (
        SELECT COALESCE(SUM(QuantityIn), 0) - COALESCE(SUM(QuantityOut), 0) AS Balance
        FROM dbo.StockTransactions st WHERE st.ProductId = p.Id
    ) sb
    WHERE p.Status = 1 AND COALESCE(sb.Balance, 0) <= p.MinimumStock;

    SELECT
        @TodaySales AS TodaySales, @TodayPurchase AS TodayPurchase, @TotalReceivable AS TotalReceivable,
        @TotalPayable AS TotalPayable, @TotalProducts AS TotalProducts, @TotalCustomers AS TotalCustomers,
        @LowStockCount AS LowStockCount, @TodayProfit AS TodayProfit, @MonthlySales AS MonthlySales, @MonthlyExpenses AS MonthlyExpenses;

    ;WITH SalesByDay AS (
        SELECT CONVERT(date, InvoiceDate) AS D, SUM(GrandTotal) AS Sales
        FROM dbo.Sales WHERE InvoiceDate >= @RangeFrom AND InvoiceDate <= @RangeTo
        GROUP BY CONVERT(date, InvoiceDate)
    ),
    PurchaseByDay AS (
        SELECT CONVERT(date, PurchaseDate) AS D, SUM(GrandTotal) AS Purchase
        FROM dbo.Purchases WHERE PurchaseDate >= @RangeFrom AND PurchaseDate <= @RangeTo
        GROUP BY CONVERT(date, PurchaseDate)
    )
    SELECT COALESCE(s.D, p.D) AS Day, COALESCE(s.Sales, 0) AS Sales, COALESCE(p.Purchase, 0) AS Purchase
    FROM SalesByDay s
    FULL OUTER JOIN PurchaseByDay p ON p.D = s.D
    ORDER BY Day ASC;

    SELECT Method, SUM(Amount) AS Amount
    FROM dbo.Payments
    WHERE Direction = 'RECEIVE' AND Date >= @RangeFrom AND Date <= @RangeTo
    GROUP BY Method;
END
