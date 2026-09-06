using BillingErp.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace BillingErp.Api.Auth;

// Ports src/lib/authorize.ts's authorize(module, action) as a controller/action attribute.
// Usage: [RequirePermission("PRODUCTS", "VIEW")]
public class RequirePermissionAttribute(string module, string action) : Attribute, IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var session = context.HttpContext.GetSession();
        if (session is null)
        {
            context.Result = new JsonResult(new { error = "Unauthorized" }) { StatusCode = 401 };
            return;
        }

        var permissionService = context.HttpContext.RequestServices.GetRequiredService<IPermissionService>();
        var allowed = await permissionService.CanAsync(session.RoleId, module, action);
        if (!allowed)
        {
            context.Result = new JsonResult(new
            {
                error = $"You don't have permission to {action.ToLowerInvariant()} {module.ToLowerInvariant()}.",
            })
            { StatusCode = 403 };
            return;
        }

        await next();
    }
}

// Ports src/lib/authorize.ts's authorizeSession() — "must be logged in", no specific permission.
public class RequireSessionAttribute : Attribute, IAsyncActionFilter
{
    public Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var session = context.HttpContext.GetSession();
        if (session is null)
        {
            context.Result = new JsonResult(new { error = "Unauthorized" }) { StatusCode = 401 };
            return Task.CompletedTask;
        }

        return next();
    }
}
