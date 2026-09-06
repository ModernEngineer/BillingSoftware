-- Flat clone of Employee.salary into a DRAFT Payroll row per active employee for the given
-- month/year, skipping employees who already have a row for that month/year — set-based
-- (anti-join), no loop needed, and safe to run twice (second run inserts 0 rows).
CREATE OR ALTER PROCEDURE dbo.sp_Payroll_Generate
    @Month INT,
    @Year INT,
    @Created INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRAN;

    INSERT INTO dbo.Payrolls (EmployeeId, Month, Year, Basic, Allowances, Deductions, NetPay, Status, CreatedAt)
    SELECT e.Id, @Month, @Year, e.Salary, 0, 0, e.Salary, 'DRAFT', SYSUTCDATETIME()
    FROM dbo.Employees e
    WHERE e.Status = 1
      AND NOT EXISTS (
          SELECT 1 FROM dbo.Payrolls p WHERE p.EmployeeId = e.Id AND p.Month = @Month AND p.Year = @Year
      );

    SET @Created = @@ROWCOUNT;

    COMMIT TRAN;
END
