package internal

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestParseDiffTracksAddedLineNumbers(t *testing.T) {
	diff := "diff --git a/config.go b/config.go\n+++ b/config.go\n@@ -1,2 +1,4 @@\n package main\n+const token = \"secret\"\n+const other = \"value\"\n"

	got := parseDiff(diff)

	if len(got) != 2 {
		t.Fatalf("parseDiff() returned %d lines, want 2", len(got))
	}
	if got[0].File != "config.go" || got[0].Line != 2 || got[0].Text != "const token = \"secret\"" {
		t.Errorf("first added line = %#v, want config.go:2 with token", got[0])
	}
	if got[1].Line != 3 {
		t.Errorf("second added line number = %d, want 3", got[1].Line)
	}
}

func TestLoadScannablePatternsCombinesManifestAndBuiltinRules(t *testing.T) {
	dir := t.TempDir()
	manifestPath := filepath.Join(dir, "manifest.yaml")
	builtinPath := filepath.Join(dir, "builtin.yaml")

	if err := os.WriteFile(manifestPath, []byte("buckets:\n  A1:\n    - id: remote\n      rule_name: Remote rule\n      pattern: REMOTE_[A-Z]+\n      logic: regex\n      remediation: Remove it\n    - id: ignored\n      rule_name: Ignored\n      pattern: ignored\n      logic: contains\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(builtinPath, []byte("patterns:\n  - id: local\n    name: Local rule\n    regex: LOCAL_[A-Z]+\n    severity: MID\n    remediation: Remove it\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	got, err := LoadScannablePatterns(manifestPath, builtinPath)
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 2 {
		t.Fatalf("LoadScannablePatterns() returned %d rules, want 2", len(got))
	}
	if got[0].ID != "remote" || got[1].ID != "local" {
		t.Fatalf("rule IDs = %q, %q, want remote, local", got[0].ID, got[1].ID)
	}
}

func TestFetchAndCacheRulesLoadsRemoteRuleForScanning(t *testing.T) {
	dir := t.TempDir()
	manifestPath := filepath.Join(dir, "manifest.yaml")
	builtinPath := filepath.Join(dir, "builtin.yaml")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.String() != "/reg?bucket=A1" {
			t.Fatalf("request URL = %q, want /reg?bucket=A1", r.URL.String())
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"buckets":{"A1":[{"id":"remote-only","rule_name":"Remote-only rule","pattern":"REMOTE_ONLY_[A-Z]+","logic":"regex","test_pass":"REMOTE_ONLY_OK","test_fail":"REMOTE_ONLY_BAD","remediation":"Remove it"}]}}`))
	}))
	defer server.Close()

	ruleCount, _, err := FetchAndCacheRules(server.URL, manifestPath, builtinPath)
	if err != nil {
		t.Fatal(err)
	}
	if ruleCount != 1 {
		t.Fatalf("FetchAndCacheRules() loaded %d rules, want 1", ruleCount)
	}

	if err := os.MkdirAll(filepath.Join(dir, ".pg", "cache"), 0o700); err != nil {
		t.Fatal(err)
	}
	// ScanPatterns uses the CLI cache paths, so place the fetched fixture there.
	if err := os.Rename(manifestPath, filepath.Join(dir, ".pg", "cache", "manifest.yaml")); err != nil {
		t.Fatal(err)
	}
	if err := os.Rename(builtinPath, filepath.Join(dir, ".pg", "cache", "builtin.yaml")); err != nil {
		t.Fatal(err)
	}
	oldDir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(dir); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Chdir(oldDir) })

	violations := ScanPatterns("+++ b/remote.txt\n@@ -0,0 +1 @@\n+REMOTE_ONLY_VALUE\n", Config{})
	if len(violations) != 1 || violations[0].Pattern != "Remote-only rule" {
		t.Fatalf("ScanPatterns() = %#v, want one remote violation", violations)
	}
}

func TestScanPatternsReportsOnlyAddedMatchingLines(t *testing.T) {
	dir := t.TempDir()
	oldDir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(dir); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Chdir(oldDir) })

	if err := os.MkdirAll(filepath.Join(".pg", "cache"), 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(".pg", "cache", "builtin.yaml"), []byte("patterns:\n  - id: key\n    name: API key\n    regex: 'AKIA[0-9A-Z]{16}'\n    severity: HIGH\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	key := "AKIA" + strings.Repeat("1", 16)
	diff := "+++ b/app.go\n@@ -1,2 +1,3 @@\n-old\n+" + key + "\n+safe\n"
	violations := ScanPatterns(diff, Config{})
	if len(violations) != 1 {
		t.Fatalf("ScanPatterns() returned %d violations, want 1", len(violations))
	}
	if violations[0].File != "app.go" || violations[0].Line != 1 || violations[0].Severity != "HIGH" {
		t.Errorf("violation = %#v, want app.go:1 HIGH", violations[0])
	}
}
