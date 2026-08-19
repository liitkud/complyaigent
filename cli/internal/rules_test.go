package internal

import (
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
