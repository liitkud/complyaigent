# HANDOFF — Real-Time Webhooks & Enterprise Vector Clustering

**Status:** Planned  
**Branch:** `feat/webhooks-and-vector-clustering`  
**Target:** `dev`  
**Owner / next reader:** Backend Architect / Integration Engineer  
**Last updated:** 2026-08-21

## Bottom line

Extend the FerretOPS platform with outgoing operational webhooks (instant Slack/Discord/Teams notifications when high-severity compliance violations require Human-in-the-Loop approval) and production multi-node Milvus vector cluster support for large-scale statutory knowledge bases.

## Current state

- Compliance verification pipeline emits 202 ACCEPTED verdicts for A2 rules requiring human review.
- Operator reviews violations via the live HITL Approval Console in `frontend/app/dashboard/page.tsx`.
- Embeddings and similarity search currently leverage local in-memory batch caching (`BatchEmbeddingCache`) and SQLite/PostgreSQL vector stores.

## Hook points (files to touch)

- `backend/app/services/pipeline.py` & `backend/app/api/validate.py` — dispatch webhook events on HITL escalation.
- `backend/app/core/config.py` — add `WEBHOOK_URL`, `WEBHOOK_SECRET`, `MILVUS_CLUSTER_NODES`.
- `backend/app/services/extractor.py` — support distributed Milvus vector collection indexing.
- `frontend/components/hitl/HITLApprovalCard.tsx` — display webhook delivery status badge.

## Open follow-ups

- [ ] Create branch `feat/webhooks-and-vector-clustering` from `dev`.
- [ ] Implement async webhook dispatcher (`httpx.AsyncClient` with exponential backoff) in `backend/app/services/webhook.py`.
- [ ] Add webhook payload signature verification (`HMAC-SHA256`).
- [ ] Configure Milvus distributed cluster client connection in `backend/app/services/extractor.py`.
- [ ] Add unit and integration tests in `backend/tests/test_webhooks.py`.

## How to verify

```bash
cd backend
uv run python -m pytest tests/test_webhooks.py
```

## Done means

- [ ] Webhook triggers within 200ms of a 202 HITL escalation event.
- [ ] Remote Milvus clustering handles 10,000+ policy control vectors with <50ms retrieval latency.
