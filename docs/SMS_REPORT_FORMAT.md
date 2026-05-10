# SMS facility report format

Workers send **structured SMS** messages that the `inbound-sms` Edge Function parses into `reports` rows.

## Canonical pattern

```
F{facility_id}#{block}#{CONDITION}
```

| Segment | Name | Description |
|--------|------|----------------|
| 1 | `F{facility_id}` | Literal **`F`** followed by the facility identifier (recommended: **UUID** from the database, or legacy numeric code as implemented in the Edge Function). |
| 2 | `{block}` | **Block / section / zone** label at the site (e.g. `A`, `B`, `1`, `MAIN`). Shown in generated report notes; no separate DB column. |
| 3 | `{CONDITION}` | Sanitation condition — must match a **valid value** or **alias** (see below). Comparison is **case-insensitive** for the condition token. |

**Separators:** exactly two ASCII **`#`** characters split the three parts. Do **not** use spaces inside the pattern (trimming only applies to the whole message).

### Examples

```text
F83d91892-1fa6-4c8e-a050-e765c5962621#A#good
F83d91892-1fa6-4c8e-a050-e765c5962621#NORTH#overflow
F1#B#damaged
```

Production deployments should distribute **facility UUIDs** (or stable printed codes) to workers; numeric `F1`, `F2` behaviour depends on the `findFacility` lookup logic in `supabase/functions/inbound-sms/index.ts`.

### Valid `CONDITION` values (database enums)

| Value | Meaning |
|-------|---------|
| `good` | Operating normally |
| `damaged` | Damage / partial function |
| `overflow` | Overflow / spillage |
| `dry` | No water |
| `blocked` | Blocked / clogged |
| `out_of_service` | Not usable |

**Aliases** (examples): `ok`→`good`, `broken`→`damaged`, `overflowing`→`overflow`, `clogged`→`blocked`, `notworking`→`out_of_service`. See `CONDITION_ALIASES` in the Edge Function source for the full list.

### Provider payload mapping (Africa’s Talking)

Incoming webhooks typically send **URL-encoded form** fields. The function reads:

| Field | Used as |
|-------|---------|
| `text` | Full SMS body (must match the pattern above) |
| `from` | Reporter phone (normalized to E.164, Ghana‑biased) |
| `id` | Provider message id (logged to `sms_gateway_logs`) |
| `to`, `date`, `linkId`, `networkCode` | Optional; stored in log metadata |

### HTTP test body (JSON)

For manual tests and CI, POST JSON:

```json
{ "text": "F<facility-uuid>#A#good", "from": "+233XXXXXXXXX" }
```

### Related docs

- Edge Function: `supabase/functions/inbound-sms/README.md`
- Africa’s Talking webhook setup: same README, **Sandbox / Incoming** section
