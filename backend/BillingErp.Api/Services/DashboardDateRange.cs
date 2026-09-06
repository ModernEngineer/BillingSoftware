namespace BillingErp.Api.Services;

// Pure port of src/lib/date-range.ts's getRangeDates — no DB access.
public static class DashboardDateRange
{
    public static (DateTime From, DateTime To) Get(string range, string? customFrom, string? customTo)
    {
        var now = DateTime.Now;
        var startOfToday = now.Date;
        var endOfToday = startOfToday.AddDays(1).AddMilliseconds(-1);

        return range switch
        {
            "today" => (startOfToday, endOfToday),
            "7d" => (startOfToday.AddDays(-6), endOfToday),
            "30d" => (startOfToday.AddDays(-29), endOfToday),
            "month" => (new DateTime(now.Year, now.Month, 1), endOfToday),
            "year" => (new DateTime(now.Year, 1, 1), endOfToday),
            "custom" => (
                customFrom is not null ? DateTime.Parse(customFrom) : startOfToday,
                customTo is not null ? DateTime.Parse(customTo).Date.AddDays(1).AddMilliseconds(-1) : endOfToday),
            _ => (startOfToday, endOfToday),
        };
    }
}
