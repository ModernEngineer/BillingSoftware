namespace BillingErp.Api.Auth;

// Reads the billing_session cookie on every request and stashes the validated payload on
// HttpContext.Items — the equivalent of calling getSession() once per request in Next.js.
public class SessionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, TokenService tokenService)
    {
        var token = context.Request.Cookies[TokenService.CookieName];
        if (!string.IsNullOrEmpty(token))
        {
            var session = tokenService.ValidateToken(token);
            if (session is not null)
            {
                context.Items["Session"] = session;
            }
        }

        await next(context);
    }
}

public static class HttpContextSessionExtensions
{
    public static SessionPayload? GetSession(this HttpContext context) => context.Items["Session"] as SessionPayload;
}
