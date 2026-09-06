-- Absolute-value update (not COALESCE): PayrollController computes the final Allowances/
-- Deductions/NetPay/Status/PaidDate in C# first (mirrors the original's read-then-compute-then-
-- write logic, which can't be expressed as a simple per-column COALESCE since PaidDate depends on
-- whether Status is being changed to PAID in *this* request, not just its current value).
CREATE OR ALTER PROCEDURE dbo.sp_Payroll_Update
    @PayrollId INT,
    @Allowances DECIMAL(18,2),
    @Deductions DECIMAL(18,2),
    @NetPay DECIMAL(18,2),
    @Status NVARCHAR(20),
    @PaidDate DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Payrolls
    SET Allowances = @Allowances,
        Deductions = @Deductions,
        NetPay = @NetPay,
        Status = @Status,
        PaidDate = @PaidDate
    WHERE Id = @PayrollId;
END
