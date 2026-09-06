CREATE OR ALTER PROCEDURE dbo.sp_User_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.Id, u.Name, u.Email, u.Mobile, u.Status, u.LastLogin, u.RoleId, r.Name AS RoleName
    FROM dbo.Users u
    JOIN dbo.Roles r ON r.Id = u.RoleId
    ORDER BY u.Name ASC;
END
