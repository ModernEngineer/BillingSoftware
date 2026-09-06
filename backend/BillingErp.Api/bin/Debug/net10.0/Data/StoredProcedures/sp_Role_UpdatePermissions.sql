-- @PermissionKeysJson: ["MODULE:ACTION", ...] — flattened from the {module:[actions]} request
-- body by the controller (only keys that actually match a row in Permissions are assigned).
CREATE OR ALTER PROCEDURE dbo.sp_Role_UpdatePermissions
    @RoleId INT,
    @PermissionKeysJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRAN;

    DELETE FROM dbo.RolePermissions WHERE RoleId = @RoleId;

    INSERT INTO dbo.RolePermissions (RoleId, PermissionId)
    SELECT @RoleId, p.Id
    FROM dbo.Permissions p
    WHERE CONCAT(p.Module, ':', p.Action) IN (SELECT value FROM OPENJSON(@PermissionKeysJson));

    COMMIT TRAN;
END
