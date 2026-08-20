# HANDOFF — Fedora / EPEL COPR Release Pipeline Automation

**Status:** In progress  
**Branch:** `dev`  
**Target:** Fedora COPR (`liitkud/ferretops-cli`)  
**Owner / next reader:** DevOps / Packaging Engineer  
**Last updated:** 2026-08-21

## Bottom line

Connect the newly added RPM packaging specification and `.copr/Makefile` to Fedora COPR so that every tagged release (`v*`) automatically builds and publishes native `.rpm` packages for Fedora and Enterprise Linux (CentOS/RHEL/Rocky/AlmaLinux).

## Current state

- Packaging definitions added:
  - Spec file: [`cli/packaging/rpm/ferretops-cli.spec`](../../cli/packaging/rpm/ferretops-cli.spec) builds binary `pg` (`/usr/bin/pg`).
  - Native COPR SRPM builder: [`.copr/Makefile`](../../.copr/Makefile) produces `.src.rpm` automatically.
  - Release workflow: [`.github/workflows/release.yml`](../../.github/workflows/release.yml) has `copr` job stub configured to execute `copr-cli build-package`.
- GitHub repository secrets for COPR authentication (`COPR_LOGIN`, `COPR_TOKEN`) are pending registration by repository maintainer.

## Hook points (files to touch)

- `.copr/Makefile` — SRPM build directives.
- `cli/packaging/rpm/ferretops-cli.spec` — Version stamping and RPM dependencies.
- `.github/workflows/release.yml` — COPR API trigger job.

## Open follow-ups

- [ ] Create COPR project `ferretops-cli` under `liitkud` on [copr.fedorainfracloud.org](https://copr.fedorainfracloud.org).
- [ ] Configure GitHub repository secrets:
  - `COPR_LOGIN`: COPR API username/login token.
  - `COPR_TOKEN`: COPR API token secret.
  - `COPR_PROJECT`: Project slug (`ferretops-cli`).
- [ ] Test trigger via GitHub Actions release workflow or tag push.

## How to verify

```bash
# Test local SRPM build using mock/rpmbuild:
mkdir -p /tmp/rpmbuild/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS,SRPMS}
git archive --format=tar.gz --prefix=ferretops-cli-0.1.0/ HEAD -o /tmp/rpmbuild/SOURCES/v0.1.0.tar.gz
cp cli/packaging/rpm/ferretops-cli.spec /tmp/rpmbuild/SPECS/
rpmbuild -bs --define "_topdir /tmp/rpmbuild" /tmp/rpmbuild/SPECS/ferretops-cli.spec
```

## Done means

- [ ] COPR repo is active and accessible via `dnf copr enable liitkud/ferretops-cli`.
- [ ] Tag releases automatically produce installable RPM packages on COPR.
