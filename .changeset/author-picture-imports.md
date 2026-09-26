---
"starlight-recipes": patch
---

Fixes a build error when a global author with a local `picture` uses a configuration key that is not a valid JavaScript identifier, e.g. `john-doe`, or has a name containing double quotes.
