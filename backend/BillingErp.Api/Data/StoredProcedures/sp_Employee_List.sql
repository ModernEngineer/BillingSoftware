CREATE OR ALTER PROCEDURE dbo.sp_Employee_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, Designation, Department, Mobile, Email, JoiningDate, Salary, Status, CreatedAt
    FROM dbo.Employees
    ORDER BY Name ASC;
END
