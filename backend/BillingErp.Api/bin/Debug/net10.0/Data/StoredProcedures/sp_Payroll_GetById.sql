CREATE OR ALTER PROCEDURE dbo.sp_Payroll_GetById
    @PayrollId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, EmployeeId, Month, Year, Basic, Allowances, Deductions, NetPay, Status, PaidDate, CreatedAt
    FROM dbo.Payrolls
    WHERE Id = @PayrollId;
END
