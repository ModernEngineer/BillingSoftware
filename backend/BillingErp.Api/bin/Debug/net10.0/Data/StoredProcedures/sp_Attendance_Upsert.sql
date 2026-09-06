-- Upserts by the (EmployeeId, Date) unique constraint, matching the original's
-- prisma.attendance.upsert. Returns the resulting flat row (the original's upsert call has no
-- `include`, so the response is the bare Attendance record, no Employee join).
CREATE OR ALTER PROCEDURE dbo.sp_Attendance_Upsert
    @EmployeeId INT,
    @Date DATETIME2,
    @Status NVARCHAR(20),
    @CheckIn NVARCHAR(20) = NULL,
    @CheckOut NVARCHAR(20) = NULL,
    @Note NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRAN;

    DECLARE @Id INT;
    SELECT @Id = Id FROM dbo.Attendances WITH (UPDLOCK, HOLDLOCK) WHERE EmployeeId = @EmployeeId AND Date = @Date;

    IF @Id IS NOT NULL
    BEGIN
        UPDATE dbo.Attendances
        SET Status = @Status, CheckIn = @CheckIn, CheckOut = @CheckOut, Note = @Note
        WHERE Id = @Id;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.Attendances (EmployeeId, Date, Status, CheckIn, CheckOut, Note)
        VALUES (@EmployeeId, @Date, @Status, @CheckIn, @CheckOut, @Note);
        SET @Id = SCOPE_IDENTITY();
    END

    COMMIT TRAN;

    SELECT Id, EmployeeId, Date, Status, CheckIn, CheckOut, Note FROM dbo.Attendances WHERE Id = @Id;
END
