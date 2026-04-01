---
"starlight-recipes": patch
---

**⚠️ Security fix**: Do not expose `STARLIGHT_RECIPES_RATING_SECRET` secret to the client.

The previous release bundled the namespace secret into the build output and the `0.1.0` version is therefore locked from downloads.
