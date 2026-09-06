-- Not exposed as its own route in the original (no GET [id] for employees) — used internally by
-- EmployeesController to re-fetch the row after Create/Update, mirroring the Product pattern.
CREATE OR ALTER PROCEDURE dbo.sp_Employee_GetById
    @EmployeeId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, Designation, Department, Mobile, Email, JoiningDate, Salary, Status, CreatedAt
    FROM dbo.Employees
    WHERE Id = @EmployeeId;
END
