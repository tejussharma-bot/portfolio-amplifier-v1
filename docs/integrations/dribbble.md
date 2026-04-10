# Dribbble

Product mode: guided upload in V1

Auth URL: `https://dribbble.com/oauth/authorize`
Token URL: `https://dribbble.com/oauth/token`
API base URL: `https://api.dribbble.com/v2`
Required scopes:
- Connect: `public`
- Upload: `upload`

Required env vars:
- `DRIBBBLE_CLIENT_ID`
- `DRIBBBLE_CLIENT_SECRET`
- `DRIBBBLE_REDIRECT_URI`

Redirect URI rules:
- OAuth callback must terminate at `/api/channels/dribbble/callback`.

Supported actions:
- account connect
- capability validation
- export/guided upload

Unsupported actions:
- direct posting unless a compliant shot-render pipeline is validated
- scheduling

Fallback behavior:
- Until shot upload is fully tested, Dribbble should render as export-first or guided-upload, not as a direct publish promise.
