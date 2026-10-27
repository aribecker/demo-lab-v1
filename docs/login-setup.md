# Login setup — Google, GitHub and Microsoft

The /login route uses real authorization-code flows through the existing Java API. It will show all three providers, but each remains disabled until its client ID and client secret are configured. Connecting ChatGPT to a provider does not register this demo as an OAuth client.

## Redirect URIs (copy exactly)

| Provider | Callback |
| --- | --- |
| Google | https://ariel-weather-api-iteration-2.onrender.com/login/oauth2/code/google |
| GitHub | https://ariel-weather-api-iteration-2.onrender.com/login/oauth2/code/github |
| Microsoft | https://ariel-weather-api-iteration-2.onrender.com/login/oauth2/code/microsoft |

Demo Home: https://ariel-weather-iteration-2.onrender.com/
Login: https://ariel-weather-iteration-2.onrender.com/login

## Register applications

- Google: https://console.cloud.google.com/auth/clients — create a Web application OAuth client, configure branding/audience, add the Google callback above, and add your account to test users while in testing mode. Basic scopes: openid, profile, email.
- GitHub: https://github.com/settings/developers — create a new OAuth App, set Home and GitHub callback above. Requested scopes: read:user and user:email. No repository access.
- Microsoft: https://entra.microsoft.com/ — App registrations → New registration. For both work/school and personal accounts, choose that supported account type. Add the Microsoft callback as a Web platform; create a client secret and grant delegated Microsoft Graph User.Read. Use Application (client) ID and secret VALUE, not secret ID. Tenant policies may restrict work/school consent.

## Configure Render securely

Open https://dashboard.render.com/web/srv-dbbblerbc2fs73ajn9l0 → Environment. Add the corresponding pairs:

- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
- GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
- MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET

Secrets belong only on the Java service; never in VITE_ variables, source files or chat. Save and deploy. A provider is enabled only when its pair is nonempty. Use /auth/providers to check enabled status without exposing values.

Public defaults already match this deployment. If URLs change, set AUTH_FRONTEND_URL (origin without trailing slash), AUTH_BACKEND_URL (origin without trailing slash), ALLOWED_ORIGINS (exact frontend origin), and rebuild the frontend with VITE_AUTH_API_URL (API origin). Do not accept arbitrary frontend redirect targets.

## Verify each provider

1. Open /login and choose its enabled button.
2. Complete consent in the provider's own page.
3. Confirm name, available email and account ID, plus photo/locale/profile URL when shared.
4. Reload /login to restore the demo session in the same tab.
5. Sign out of the demo and confirm that the profile clears.
6. Repeat with denial/cancel and with the other providers.

The 30-minute session token is scoped to this demo and stored in sessionStorage; no upstream access/refresh token is exposed to React. The backend stores only hashes of demo tokens and handoff tickets. Callback URLs contain only a short-lived, one-use ticket bound to that browser's verifier; React immediately removes the fragment. In-memory sessions are lost on a backend redeploy or restart. Signout does not sign out of Google/GitHub/Microsoft. Email may be absent; Microsoft userPrincipalName is used as an account address fallback and is not asserted to be a verified mailbox. There is no account linking or private weather API.

## Local development

Set AUTH_FRONTEND_URL=http://localhost:5173, AUTH_BACKEND_URL=http://localhost:8080 and AUTH_COOKIE_SECURE=false on Java, VITE_AUTH_API_URL=http://localhost:8080 on Vite. Register localhost callbacks separately with each provider. Never weaken production cookies.

## Primary references

- https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow
