CREATE OR ALTER PROCEDURE dbo.sp_Permission_GetForRole
    @RoleId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Module, p.Action
    FROM dbo.RolePermissions rp
    JOIN dbo.Permissions p ON p.Id = rp.PermissionId
    WHERE rp.RoleId = @RoleId;
END
