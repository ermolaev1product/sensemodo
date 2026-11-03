# First-party optional visit statistics

Source static pages remain in out/ unchanged. The supported Vinext Worker build copies them to public/ and injects a deferred consent/preferences script into public presentation pages. Existing dormant account code and schemas are not activated; only db/analytics-schema.ts is used for migrations.

Collection begins only after Allow statistics. Decline persists only the preference. GPC and DNT disable collection. Browser token is random and rotates at Asia/Tbilisi midnight; it is hashed with that date server-side. No IP, user-agent, form field, email, account ID, full referrer, query or fragment is stored. Source is a coarse allowlisted category. Token is scoped to this origin, never shared across sites.

traffic_events_v2 stores one row per measured page view. occurred_at is server UTC ISO timestamp, day_tbilisi is Asia/Tbilisi date. visitor is an anonymous daily browser proxy, not a person; do not sum daily unique values for weekly unique people. active_seconds approximates visible, focused, recently interacted time, capped at four hours per view; it is not session duration. Minute/tab pauses are excluded. is_test=1 must always be excluded from audience reports. Known automated user agents and DNT/GPC are excluded; other bots and owner visits may remain.

Retention: rows older than 90 local calendar days are purged on the next accepted collection request. No public read endpoint. Consent may be withdrawn from the small statistics control. Future calls stop and the local daily token is removed; previously collected anonymous records expire under retention.

QA: set localStorage["visit-metrics-test"]="1" before consenting in a test browser. Do not change this on users' devices. Test requests must use test:true. No historical backfill.
