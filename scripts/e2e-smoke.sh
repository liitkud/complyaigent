#!/usr/bin/env bash
# MVP E2E smoke (#78): health → ingest fixture → MID validate → HITL approve
# Requires a running backend (compose or uv). Does not require LLM keys.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="${API_URL:-http://localhost:8000}"
FIXTURE="${FIXTURE:-$ROOT/docs/mvp/fixtures/access-control.md}"
MARKER="${E2E_HITL_MARKER:-COMPLYAIGENT_E2E_HITL_MID}"
RULE_ID="${RULE_ID:-00000000-0000-0000-0000-000000000001}"

log() { printf '[e2e] %s\n' "$*"; }
die() { printf '[e2e] ERROR: %s\n' "$*" >&2; exit 1; }
need_cmd() { command -v "$1" >/dev/null 2>&1 || die "missing command: $1"; }

need_cmd curl
need_cmd python3

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

log "API_URL=$API_URL"

log "1/5 health"
curl -fsS "$API_URL/health" -o "$tmpdir/health.json"
python3 -c "import json; d=json.load(open('$tmpdir/health.json')); assert d.get('status')=='healthy', d"
log "health ok"

log "2/5 ingest sample policy ($FIXTURE)"
[[ -f "$FIXTURE" ]] || die "fixture missing: $FIXTURE"
curl -fsS -X POST "$API_URL/ingest" \
  -F "file=@${FIXTURE};type=text/markdown" \
  -o "$tmpdir/ingest.json"
python3 -c "import json; d=json.load(open('$tmpdir/ingest.json')); assert 'task_id' in d or 'policy_id' in d, d"
TASK_ID="$(python3 -c "import json; print(json.load(open('$tmpdir/ingest.json')).get('task_id') or '')")"
POLICY_ID="$(python3 -c "import json; print(json.load(open('$tmpdir/ingest.json')).get('policy_id') or '')")"
log "ingest accepted task_id=${TASK_ID:-n/a} policy_id=${POLICY_ID:-n/a}"

if [[ -n "$TASK_ID" ]]; then
  for _ in 1 2 3 4 5; do
    if curl -fsS "$API_URL/ingest/$TASK_ID" -o "$tmpdir/ingest_status.json" 2>/dev/null; then
      STATUS="$(python3 -c "import json; print(json.load(open('$tmpdir/ingest_status.json')).get('status',''))" 2>/dev/null || true)"
      log "ingest status=$STATUS"
      [[ "$STATUS" == "complete" || "$STATUS" == "failed" ]] && break
    fi
    sleep 1
  done
fi

log "3/5 POST /validate with E2E MID marker (no LLM required)"
MARKER="$MARKER" RULE_ID="$RULE_ID" POLICY_ID="$POLICY_ID" python3 - <<'PY' >"$tmpdir/validate_req.json"
import json, os
payload = {
  "code_snippet": f"role = 'admin'  # {os.environ['MARKER']}",
  "rule_id": os.environ["RULE_ID"],
  "repo": "e2e-smoke",
  "context": "mvp-e2e",
}
pid = os.environ.get("POLICY_ID") or ""
if pid:
  payload["policy_id"] = pid
print(json.dumps(payload))
PY
curl -fsS -X POST "$API_URL/validate" \
  -H 'Content-Type: application/json' \
  -d @"$tmpdir/validate_req.json" \
  -o "$tmpdir/validate.json"
VAL_ID="$(python3 -c "import json; print(json.load(open('$tmpdir/validate.json'))['validation_id'])")"
log "validation_id=$VAL_ID"

log "4/5 GET pending MID list"
curl -fsS "$API_URL/validate" -o "$tmpdir/list.json"
python3 -c "
import json
vid = '''$VAL_ID'''
rows = json.load(open('$tmpdir/list.json'))
match = [r for r in rows if r.get('validation_id') == vid]
assert match, ('missing validation', rows[:3])
r = match[0]
assert r.get('verdict') == 'MID', r
assert r.get('status') == 'pending', r
print('pending MID ok')
"

log "5/5 PATCH approve HITL"
curl -fsS -X PATCH "$API_URL/validate/$VAL_ID" \
  -H 'Content-Type: application/json' \
  -d '{"action":"approve"}' \
  -o "$tmpdir/approve.json"
python3 -c "import json; d=json.load(open('$tmpdir/approve.json')); assert d.get('success') is True and d.get('status')=='approved', d"
curl -fsS "$API_URL/validate/$VAL_ID" -o "$tmpdir/final.json"
python3 -c "import json; d=json.load(open('$tmpdir/final.json')); assert d.get('status')=='approved', d"

log "PASS — live HITL approve path ok (validation_id=$VAL_ID)"
log "Dashboard: open http://localhost:3000 and confirm HITL card is empty after refresh"
log "Notes: Loki sink (#77) and Presidio PII (#79) are optional for this smoke"
