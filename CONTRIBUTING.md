# Contributing to ReelLoom

Thanks for helping improve ReelLoom. Small, verifiable changes are preferred.

## Before opening a pull request

1. Create a focused branch from `main`.
2. Do not commit cookies, browser profiles, account data, API keys, private
   collections, generated knowledge bases, or logs containing personal data.
3. Add or update tests when behavior changes.
4. Run `npm test` and describe any platform-specific manual verification.
5. Keep collectors and browser automation rate-limited, stop on CAPTCHA, and
   document the source and date of selector changes.

## Useful contribution areas

- Collector reliability and selector fallbacks
- Analyzer parsing and explicit failure modes
- Markdown / Obsidian output quality
- Checkpoint, recovery, and migration tools
- Documentation that makes a clean installation reproducible

Bug reports should include the command, operating system, Node.js version,
sanitized logs, and the smallest reproducible example. Never attach session
cookies or private video/collection data.
