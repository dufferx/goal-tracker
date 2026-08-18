# Goal Tracker — Identity Operations

**Milestone:** M1 identity and user isolation
**Scope:** Development and early operation on both the managed reference deployment (Supabase
Cloud) and the documented self-hosted option. Production hardening, TLS, backup, restore, and
upgrades remain M6 work.

## Configuration boundary

Goal Tracker has two layers of authentication configuration:

1. Supabase Auth enforces whether email/password registration and password-reset email actually
   work.
2. The Goal Tracker API publishes matching, non-sensitive capability flags so the web interface can
   present only actions the deployment supports.

The public flags are never security controls. Keep them aligned:

| Goal Tracker capability | Supabase Auth enforcement |
| --- | --- |
| `PUBLIC_REGISTRATION_ENABLED=true` | `GOTRUE_DISABLE_SIGNUP=false` and `GOTRUE_EXTERNAL_EMAIL_ENABLED=true` |
| `PUBLIC_REGISTRATION_ENABLED=false` | `GOTRUE_DISABLE_SIGNUP=true` |
| `PUBLIC_PASSWORD_RECOVERY_EMAIL_ENABLED=true` | SMTP is configured and reset redirects are allowed |
| `PUBLIC_PASSWORD_RECOVERY_EMAIL_ENABLED=false` | The UI presents administrator-assisted recovery and sends no reset request |

The browser receives only `VITE_SUPABASE_URL` and a publishable key. Never expose a secret key,
service-role key, database URL, SMTP password, or JWT-signing material through a `VITE_*` variable.

## Local development

The pinned Supabase CLI configuration enables email/password signup and captures Auth email in
Mailpit.

```sh
pnpm install
pnpm infra:start
pnpm supabase status
```

Copy the reported API URL and publishable (or legacy local anon) key into both public and API
variables shown in `.env.example`. Mailpit is normally available at `http://127.0.0.1:54324`.

The local Auth site URL is `http://127.0.0.1:5173`. Password recovery redirects exactly to:

```text
http://127.0.0.1:5173/update-password
```

If the development URL changes, update `site_url` and `additional_redirect_urls` in
`supabase/config.toml` as well as the matching web environment.

### Migration and isolation verification

With Docker available, reset the local stack so the committed migration is applied, then run the
real Auth/Data API integration suite with the values printed by `pnpm supabase status`:

```sh
pnpm infra:start
pnpm db:reset
M1_SUPABASE_URL=http://127.0.0.1:54321 \
M1_SUPABASE_PUBLISHABLE_KEY='<local publishable key>' \
M1_SUPABASE_SERVICE_ROLE_KEY='<local secret or legacy service-role key>' \
pnpm --filter @goal-tracker/api test:m1:integration
```

The privileged key is used only to create and clean up test users. Assertions access
`public.profiles` as two ordinary authenticated users and an anonymous client, proving provisioning,
constraints, own-row access, cross-user denial, and anonymous denial through real RLS.

## Managed reference deployment

In the reference deployment, Auth, registration, SMTP, site URL, and redirect configuration live in
the Supabase Cloud project settings (Authentication and email sections), not in deployment
environment variables. The same Goal Tracker capability flags apply: publish
`PUBLIC_REGISTRATION_ENABLED` and `PUBLIC_PASSWORD_RECOVERY_EMAIL_ENABLED` through the API
environment so they match the Supabase Cloud configuration. The sections below describe the
equivalent self-hosted Auth configuration and remain valid for the documented self-hosted option.

## Self-hosted registration

Supabase's self-hosted Auth service uses deployment environment variables. To open registration,
set `GOTRUE_DISABLE_SIGNUP=false`, keep email signup enabled, and publish
`PUBLIC_REGISTRATION_ENABLED=true` to the Goal Tracker API. To close registration, set
`GOTRUE_DISABLE_SIGNUP=true` and publish `PUBLIC_REGISTRATION_ENABLED=false`.

Restart the Auth service and Goal Tracker API after changing these values. Confirm both behaviors:

- `GET /api/v1/capabilities` reports the expected flag;
- a direct signup attempt is accepted when open and rejected by Supabase when closed.

Closing the Goal Tracker link alone is insufficient because clients can call Auth directly.

## SMTP and password recovery

Password reset requires a working SMTP service. Configure the current self-hosted Supabase SMTP
variables, a public `SITE_URL`, and an exact redirect allow-list containing the deployed
`/update-password` URL. Then set `PUBLIC_PASSWORD_RECOVERY_EMAIL_ENABLED=true`.

Goal Tracker requests one reset email with that callback. The callback must establish a valid
recovery session before the user can set a new password. An expired or invalid session returns the
user to the recovery flow without showing protected account content.

Before advertising email recovery, test a real reset end to end. Supabase's local Mailpit is only a
development mail capture service and is not production SMTP.

## Manual password reset without SMTP

When SMTP is absent, set `PUBLIC_PASSWORD_RECOVERY_EMAIL_ENABLED=false`. The UI will not call the
reset-email endpoint or promise delivery. An operator can perform an administrator-assisted reset:

1. Verify the account owner through a channel appropriate for the private deployment.
2. From Supabase Studio's Auth users view, find the exact user UUID. Do not rely on display name or
   mutable user metadata.
3. On a trusted administrator machine, use the current Supabase Admin API
   `updateUserById(userId, { password })` with a server-only secret/service-role key to assign a
   unique temporary password.
4. Communicate that password through the verified private channel. Ask the user to sign in and
   change it immediately from Settings.
5. Remove any temporary command or script containing credentials and review Auth logs for the
   operation.

The administrator client must never run in the browser or be committed to this repository. Do not
edit `auth.users.encrypted_password` directly. Existing access tokens can remain valid until their
configured expiry, so investigate and shorten session exposure separately if the reset responds to
a suspected compromise.

Official API reference:
<https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid>

## Self-hosted URL caveat

Do not construct Auth URLs by appending or removing gateway paths in application code.
`SUPABASE_URL` is the deployment's externally reachable Supabase base URL and is passed unchanged to
the client library. In Supabase's current self-hosted Docker layout, `API_EXTERNAL_URL` includes
`/auth/v1`, while `SUPABASE_PUBLIC_URL` is the externally reachable base URL. This changed in 2026
and is a reason to keep both values deployment-configured.

Relevant upstream documentation:

- <https://supabase.com/docs/guides/self-hosting/auth/config>
- <https://supabase.com/docs/guides/self-hosting/docker>
- <https://supabase.com/docs/guides/auth/passwords>
- <https://supabase.com/docs/guides/database/postgres/row-level-security>

## M1 visual-scope deviation

The approved account-settings reference also shows Goals navigation, an Add contribution action,
and deployment version information. M1 intentionally omits those controls: goals and contributions
do not exist until M2 and M3, and release-version presentation belongs to M6. Rendering disabled or
fake destinations would make the interface less truthful. M1 retains the reference's profile,
default-currency, password, deployment-capability, and sign-out composition.
