# Africa's Talking Simulator Setup (SaniSentinel)

This guide configures both:
- **Inbound SMS** (`inbound-sms` edge function)
- **USSD flow** (`ussd-wash` edge function)

It also shows the exact values to place in the Africa's Talking Simulator.

---

## 1) Prerequisites

- Supabase project is active
- You know your project ref (for URL)
- You can run npm scripts in this repo
- Your `workers` and `facilities` tables are seeded

Function base URL pattern:

`https://<project-ref>.supabase.co/functions/v1/<function-name>`

---

## 2) Configure Supabase secrets for outbound SMS

Set Edge Function secrets in Supabase:

- `AFRICAS_TALKING_API_KEY`
- `AFRICAS_TALKING_USERNAME`

For **sandbox testing**:
- `AFRICAS_TALKING_USERNAME=sandbox`
- API key = your sandbox API key from AT dashboard

You can set secrets via Supabase Dashboard or CLI.

---

## 3) Deploy telecom edge functions

From project root:

```bash
npm run deploy:telecom
```

Equivalent one-by-one:

```bash
npm run deploy:inbound-sms
npm run deploy:send-sms-alert
npm run deploy:ussd-wash
```

JWT verification is already disabled in `supabase/config.toml` for:
- `inbound-sms`
- `ussd-wash`

This is required because Africa's Talking webhook calls do not carry Supabase JWTs.

---

## 4) Africa's Talking dashboard values to enter

Use these exact callback URLs (replace `<project-ref>`):

- **Incoming SMS callback URL**  
  `https://<project-ref>.supabase.co/functions/v1/inbound-sms`

- **USSD callback URL**  
  `https://<project-ref>.supabase.co/functions/v1/ussd-wash`

If the dashboard asks for HTTP method, use `POST`.

---

## 5) SMS simulator test (inbound)

In Africa's Talking simulator:

- Channel: **SMS**
- To: your sandbox shortcode/number
- From: use a phone in Ghana format (example `+233241234567`)
- Message format:
  - `F<facility_uuid>#<block>#<condition>`
  - Example: `F550e8400-e29b-41d4-a716-446655440000#A#overflow`

Valid conditions:
- `good`, `damaged`, `overflow`, `dry`, `blocked`, `out_of_service`

Expected result:
- New row in `reports`
- Facility status auto-updates from DB trigger
- Alert row created if condition/risk requires it

Quick verification script:

```bash
npm run test:inbound-sms
```

---

## 6) USSD simulator test

In Africa's Talking simulator:

- Channel: **USSD**
- Service code: your assigned code (example in app: `*384*11082#`)
- Phone: Ghana number (example `+233241234567`)

Flow in simulator:
1. Dial service code
2. `1` (Report facility)
3. choose facility type (`1`-`4`)
4. enter facility ID (UUID or list index)
5. choose condition (`1`-`5`)
6. enter location (e.g. `Block A`)
7. enter service date in `DDMM` or `0000`
8. confirm with `1`

Expected result:
- Response ends with success message
- New `reports` row exists with source details in notes

---

## 7) Outbound SMS test (AT API from your function)

Test outbound sending path in safe mode:

```bash
npm run test:outbound-sms
```

Then run full round-trip:

```bash
npm run test:sms-roundtrip
```

These tests verify:
- risk scoring
- alert selection
- SMS dispatch function call
- outbound log rows in `sms_gateway_logs`

---

## 8) Full scenarios you requested

Run all requested checks with these scripts:

- SMS round trip  
  `npm run test:sms-roundtrip`

- Flood event E2E  
  `npm run test:flood-event`

- Realtime check (two-client simulation)  
  `npm run test:realtime-alerts`

- Role separation  
  `npm run test:role-separation`

---

## 9) Common issues and exact fixes

- **`supabase` command not found**
  - Use npm scripts in this repo (they use `npx supabase@latest`).

- **Inbound webhook returns 401/403**
  - Ensure `inbound-sms` deployed with `verify_jwt=false`.
  - Redeploy: `npm run deploy:inbound-sms`.

- **USSD simulator reaches callback but fails**
  - Confirm USSD callback points to `.../functions/v1/ussd-wash`.
  - Confirm method is POST and simulator sends form fields.

- **Outbound SMS says API key not configured**
  - Set `AFRICAS_TALKING_API_KEY` and `AFRICAS_TALKING_USERNAME` in Supabase secrets.
  - Redeploy `send-sms-alert`.

- **No SMS recipients found**
  - Ensure active workers exist in same district as alert facility.
  - Ensure worker phone format includes country code (`+233...`).

---

## 10) Recommended sandbox-to-production switch

When ready for production:

1. Replace sandbox credentials with production AT credentials.
2. Keep callback URLs unchanged unless project ref changes.
3. Run one controlled live test with a known worker phone.
4. Monitor `sms_gateway_logs` and AT delivery reports.
