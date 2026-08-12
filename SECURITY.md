# Security policy

## Supported version

Security fixes target the latest commit on `main` until stable releases and a
formal support window are established.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature for this
repository when available. Do not open a public issue for vulnerabilities that
could expose browser sessions, credentials, private collections, or local
files.

Include a clear impact description, reproduction steps, affected versions,
and any suggested mitigation. Remove cookies, tokens, personal paths, and
private content from screenshots and logs.

## Sensitive data boundaries

ReelLoom must not commit or upload browser profiles, cookies, passwords, API
keys, authentication tokens, private collection exports, or generated user
knowledge without explicit user action. Browser automation should stop on
CAPTCHA and respect provider terms, quotas, and rate limits.
