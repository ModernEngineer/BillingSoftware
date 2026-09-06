CREATE OR ALTER PROCEDURE dbo.sp_Auth_GetUserById
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.Id, u.Name, u.Email, u.Password, u.Mobile, u.RoleId, r.Name AS RoleName, u.Status
    FROM dbo.Users u
    JOIN dbo.Roles r ON r.Id = u.RoleId
    WHERE u.Id = @UserId;
END
