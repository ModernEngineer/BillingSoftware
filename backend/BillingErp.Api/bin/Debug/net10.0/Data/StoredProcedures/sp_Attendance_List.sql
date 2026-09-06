CREATE OR ALTER PROCEDURE dbo.sp_Attendance_List
    @Date DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        a.Id, a.EmployeeId, e.Name AS EmployeeName, e.Designation AS EmployeeDesignation,
        a.Date, a.Status, a.CheckIn, a.CheckOut, a.Note
    FROM dbo.Attendances a
    JOIN dbo.Employees e ON e.Id = a.EmployeeId
    WHERE @Date IS NULL OR a.Date = @Date
    ORDER BY a.Date DESC;
END
