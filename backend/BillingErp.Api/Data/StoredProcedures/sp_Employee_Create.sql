CREATE OR ALTER PROCEDURE dbo.sp_Employee_Create
    @Name NVARCHAR(200),
    @Designation NVARCHAR(100) = NULL,
    @Department NVARCHAR(100) = NULL,
    @Mobile NVARCHAR(20) = NULL,
    @Email NVARCHAR(200) = NULL,
    @JoiningDate DATETIME2,
    @Salary DECIMAL(18,2),
    @Status BIT = 1,
    @EmployeeId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Employees (Name, Designation, Department, Mobile, Email, JoiningDate, Salary, Status, CreatedAt)
    VALUES (@Name, @Designation, @Department, @Mobile, @Email, @JoiningDate, @Salary, @Status, SYSUTCDATETIME());

    SET @EmployeeId = SCOPE_IDENTITY();
END
