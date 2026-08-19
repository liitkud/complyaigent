# MVP Fixtures

`image-only.pdf` is a synthetic PDF with an embedded image and no text layer.
The ingestion contract must fail this input explicitly instead of completing
with zero rules.

A small text-bearing `text-policy.pdf` fixture provides deterministic extraction
coverage without using a real regulatory document.

A real CHEd CMO PDF fixture is still needed for end-to-end extraction coverage.
It is not included because the source document and redistribution permission
are not available in this repository.
