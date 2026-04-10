# LinkedIn

Product mode: direct publish

Auth URL: `https://www.linkedin.com/oauth/v2/authorization`
Token URL: `https://www.linkedin.com/oauth/v2/accessToken`
API base URL: `https://api.linkedin.com/rest`
Required scopes:
- Sign-in: `openid`, `profile`, `email`
- Publish: `w_member_social`

Required headers:
- `Authorization: Bearer <token>`
- `X-Restli-Protocol-Version: 2.0.0`
- `Linkedin-Version: <YYYYMM>`

Required env vars:
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI`
- `LINKEDIN_API_VERSION` (recommended)

Redirect URI rules:
- Backend callback must terminate at `/api/channels/linkedin/callback` for channel connect.
- Backend callback must terminate at `/api/auth/linkedin/callback` for login.
- Login and channel-connect flows must not share opaque state assumptions.

Supported actions:
- account connect
- capability validation
- member posting when `w_member_social` is present
- scheduling inside Portfolio Amplifier
- export fallback

Unsupported actions:
- template selection
- case-study generation

Fallback behavior:
- If the account is linked but posting permission is missing, surface `Connected - sign-in only`.
- If the token is expired, surface `Needs reconnect`.
- If direct publish fails, keep the draft exportable and show the provider error plainly.
