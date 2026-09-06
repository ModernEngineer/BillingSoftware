-- Matches the original exactly: unconditional soft-delete (Status = 0), no active-record check,
-- never a hard delete (the original's DELETE handler just does prisma.employee.update({status:false})).
CREATE OR ALTER PROCEDURE dbo.sp_Employee_Delete
    @EmployeeId INT,
    @EmployeeName NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @EmployeeName = Name FROM dbo.Employees WHERE Id = @EmployeeId;
    IF @EmployeeName IS NOT NULL
        UPDATE dbo.Employees SET Status = 0 WHERE Id = @EmployeeId;
END
