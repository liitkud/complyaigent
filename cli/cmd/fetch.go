package cmd

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"github.com/liitkud/ferretops-cli/internal"
)

func Fetch(args []string) error {
	fs := flag.NewFlagSet("fetch", flag.ContinueOnError)
	backend := fs.String("backend", "", "Backend base URL")
	mode := fs.String("mode", "", "Scan mode (changes|full)")
	if err := fs.Parse(args); err != nil {
		return err
	}

	cfg, err := internal.LoadConfig(*backend, *mode)
	if err != nil {
		return err
	}

	cacheDir := filepath.Join(".pg", "cache")
	if err := os.MkdirAll(cacheDir, 0o755); err != nil {
		return fmt.Errorf("create cache directory: %w", err)
	}

	manifestPath := filepath.Join(cacheDir, "manifest.yaml")
	builtinPath := filepath.Join(cacheDir, "builtin.yaml")
	ruleCount, builtinCount, err := internal.FetchAndCacheRules(cfg.Backend, manifestPath, builtinPath)
	if err != nil {
		return err
	}

	fmt.Printf("✓ Loaded %d scannable rules + %d built-in patterns\n", ruleCount, builtinCount)
	return nil
}
