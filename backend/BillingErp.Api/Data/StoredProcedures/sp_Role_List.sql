-- Two result sets: 1) roles with user count, 2) every role-permission row (grouped in C#).
CREATE OR ALTER PROCEDURE dbo.sp_Role_List
AS
BEGIN
    SET NOCOUNT ON;

    SELECT r.Id, r.Name, (SELECT COUNT(*) FROM dbo.Users u WHERE u.RoleId = r.Id) AS UserCount
    FROM dbo.Roles r
    ORDER BY r.Id ASC;

    SELECT rp.RoleId, p.Module, p.Action
    FROM dbo.RolePermissions rp
    JOIN dbo.Permissions p ON p.Id = rp.PermissionId;
END
