# Authenticating requests

To authenticate requests, include an **`Authorization`** header with the value **`"Bearer {YOUR_AUTH_KEY}"`**.

All authenticated endpoints are marked with a `requires authentication` badge in the documentation below.

Obtain a token by calling <code>POST /api/auth/login</code> with your email and password, then send it as <code>Authorization: Bearer {token}</code>.
