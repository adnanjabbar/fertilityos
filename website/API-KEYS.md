# API keys

FertilityOS supports API keys for programmatic access. Only **admins** can create and revoke keys. This document describes how to create, store, and use API keys. Authentication middleware for external API callers is not yet implemented—this covers **key management** only.

---

## Creating an API key

1. Log in as an **admin** user for your clinic (tenant).
2. Go to **Developers** in the app navigation (or **App → Developers**).
3. Under **Create API key**, enter a **Name** (e.g. "Production", "CI/CD") and optionally set **Expires (days)** (or leave as "Never").
4. Click **Create key**.
5. **Copy the key immediately.** It is shown only once. If you lose it, revoke the key and create a new one.

Keys are prefixed with `fo_` (e.g. `fo_a1b2c3d4...`). The UI shows only the prefix after creation; the full secret is never stored or displayed again.

---

## Storing API keys

- **Do not** commit keys to version control or share them in chat/email.
- Store keys in environment variables or a secrets manager (e.g. `FERTILITYOS_API_KEY`).
- Rotate keys periodically and set an expiry when creating keys if your policy requires it.
- If a key is compromised, revoke it in **Developers** and create a new key.

---

## Using API keys (future)

Planned usage for external callers:

- Send the key in the **Authorization** header, for example:
  - `Authorization: Bearer fo_xxxxxxxx...`
  - or `Authorization: ApiKey fo_xxxxxxxx...`
- The server will validate the key (hash match, tenant, expiry) and scope requests to that tenant.

**Note:** As of this release, FertilityOS does **not** yet implement API authentication middleware for external callers. Keys can be created and revoked; actual use of keys to call APIs will be added in a later phase. This foundation supports the future API marketplace and programmatic access.

---

## Managing keys

- **List keys:** In the app, **Developers** shows all keys for your tenant (name, prefix, last used, expiry).
- **Revoke:** Click **Revoke** next to a key to delete it. Any existing integrations using that key will stop working.
- **Last used:** When API auth is implemented, `lastUsedAt` will be updated on each request so you can see when a key was last used.

---

## Summary

| Action        | Where                | Who    |
|---------------|----------------------|--------|
| Create key    | App → Developers      | Admin  |
| View list     | App → Developers     | Admin  |
| Revoke key    | App → Developers     | Admin  |
| Use key       | (Future) API requests | External systems |

For questions or to request API authentication for external callers, refer to the product roadmap or contact support.
