# Google Business

Product mode: direct publish

Auth URL: `https://accounts.google.com/oauth/authorize`
Token URL: `https://oauth2.googleapis.com/token`
API base URL: `https://mybusiness.googleapis.com`
Required scopes:
- Publish: `https://www.googleapis.com/auth/business.manage`

Required env vars:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CHANNEL_REDIRECT_URI`

Redirect URI rules:
- Channel callback must terminate at `/api/channels/googlemybusiness/callback`.
- Keep the publish meaning explicit as Google Business, not generic Google.

Supported actions:
- account connect
- capability validation
- publish
- schedule
- export fallback

Unsupported actions:
- template selection
- case-study generation

Fallback behavior:
- If the linked account does not expose a business profile or post target, keep the draft exportable and explain the account issue in plain language.
