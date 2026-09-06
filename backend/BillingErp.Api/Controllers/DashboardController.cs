using System.Data;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/dashboard/summary/route.ts.
[ApiController]
[Route("api/dashboard")]
public class DashboardController(SqlConnectionFactory connectionFactory) : ControllerBase
{
    private record KpiRow(
        decimal TodaySales, decimal TodayPurchase, decimal TotalReceivable, decimal TotalPayable,
        int TotalProducts, int TotalCustomers, int LowStockCount, decimal TodayProfit,
        decimal MonthlySales, decimal MonthlyExpenses);

    private record TrendRow(DateTime Day, decimal Sales, decimal Purchase);

    private record PaymentBreakdownRow(string Method, decimal Amount);

    [HttpGet("summary")]
    [RequirePermission("DASHBOARD", "VIEW")]
    public async Task<IActionResult> Summary([FromQuery] string? range, [FromQuery] string? from, [FromQuery] string? to)
    {
        var rangeKey = range ?? "30d";
        var (rangeFrom, rangeTo) = DashboardDateRange.Get(rangeKey, from, to);
        var (todayFrom, todayTo) = DashboardDateRange.Get("today", null, null);
        var monthStart = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);

        using var connection = connectionFactory.Create();
        using var multi = await connection.QueryMultipleAsync("dbo.sp_Dashboard_Summary", new
        {
            TodayFrom = todayFrom,
            TodayTo = todayTo,
            MonthStart = monthStart,
            RangeFrom = rangeFrom,
            RangeTo = rangeTo,
        }, commandType: CommandType.StoredProcedure);

        var kpi = await multi.ReadSingleAsync<KpiRow>();
        var trend = (await multi.ReadAsync<TrendRow>()).ToList();
        var paymentBreakdown = (await multi.ReadAsync<PaymentBreakdownRow>()).ToList();

        return Ok(new
        {
            kpis = new
            {
                todaySales = kpi.TodaySales,
                todayPurchase = kpi.TodayPurchase,
                totalReceivable = kpi.TotalReceivable,
                totalPayable = kpi.TotalPayable,
                totalProducts = kpi.TotalProducts,
                totalCustomers = kpi.TotalCustomers,
                lowStockCount = kpi.LowStockCount,
                todayProfit = kpi.TodayProfit,
                monthlySales = kpi.MonthlySales,
                monthlyExpenses = kpi.MonthlyExpenses,
            },
            trend = trend.Select(t => new { date = t.Day.ToString("yyyy-MM-dd"), sales = t.Sales, purchase = t.Purchase }),
            paymentBreakdown = paymentBreakdown.Select(p => new { method = p.Method, amount = p.Amount }),
        });
    }
}
