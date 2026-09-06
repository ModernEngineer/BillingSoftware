CREATE OR ALTER PROCEDURE dbo.sp_Payroll_List
    @Month INT = NULL,
    @Year INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.Id, p.EmployeeId, e.Name AS EmployeeName, e.Designation AS EmployeeDesignation,
        p.Month, p.Year, p.Basic, p.Allowances, p.Deductions, p.NetPay, p.Status, p.PaidDate, p.CreatedAt
    FROM dbo.Payrolls p
    JOIN dbo.Employees e ON e.Id = p.EmployeeId
    WHERE (@Month IS NULL OR p.Month = @Month)
      AND (@Year IS NULL OR p.Year = @Year)
    ORDER BY p.Year DESC, p.Month DESC;
END
