package cmd

import (
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func Install(args []string) error {
	fs := flag.NewFlagSet("install", flag.ContinueOnError)
	if err := fs.Parse(args); err != nil {
		return err
	}

	repoRoot, err := gitRepositoryRoot()
	if err != nil {
		return err
	}

	hookPath := filepath.Join(repoRoot, ".git", "hooks", "pre-push")
	if _, err := os.Stat(hookPath); err == nil {
		fmt.Printf("⚠️  Existing pre-push hook will be replaced: %s\n", hookPath)
	}

	hookContents := `#!/usr/bin/env sh
if command -v pg >/dev/null 2>&1; then
  exec pg scan
else
  echo "✗ pg command not found. Install the FerretOPS CLI and ensure it is on PATH."
  exit 1
fi
`

	if err := os.WriteFile(hookPath, []byte(hookContents), 0o755); err != nil {
		return fmt.Errorf("write hook: %w", err)
	}

	fmt.Printf("✓ Created git pre-push hook at %s\n", hookPath)
	return nil
}

func gitRepositoryRoot() (string, error) {
	output, err := exec.Command("git", "rev-parse", "--show-toplevel").Output()
	if err != nil {
		return "", fmt.Errorf("not a git repository: %w", err)
	}
	return strings.TrimSpace(string(output)), nil
}
