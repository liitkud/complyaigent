package cmd

import (
	"fmt"
	"os"

	"github.com/liitkud/ferretops-cli/internal"
)

func Init(args []string) error {
	fmt.Println("🚀 Initializing FerretOPS in this repository...")

	// 1. Create .pg.yaml if it doesn't exist
	if _, err := os.Stat(".pg.yaml"); os.IsNotExist(err) {
		defaultConfig := `backend: "https://aigent.kuyacarlo.dev"
mode: "changes"
exclude:
  files:
    - "package-lock.json"
    - "pnpm-lock.yaml"
    - "yarn.lock"
    - "uv.lock"
  paths:
    - "node_modules/**"
    - "vendor/**"
    - "dist/**"
`
		if err := os.WriteFile(".pg.yaml", []byte(defaultConfig), 0644); err != nil {
			return fmt.Errorf("failed to create .pg.yaml: %w", err)
		}
		fmt.Println("✓ Created .pg.yaml with default settings")
	} else {
		fmt.Println("ℹ .pg.yaml already exists, skipping creation")
	}

	// 2. Install Git Hook
	if err := Install(nil); err != nil {
		return err
	}

	// 3. Initial Fetch
	if err := Fetch(nil); err != nil {
		return err
	}

	fmt.Println("\n✨ Initialization complete! Your pushes are now protected by FerretOPS.")
	return nil
}

func Check(args []string) error {
	fmt.Println("🔍 Checking FerretOPS environment...")

	cfg, err := internal.LoadConfig("", "")
	if err != nil {
		fmt.Printf("❌ Configuration error: %v\n", err)
		return err
	}

	// 1. Check Backend
	fmt.Printf("📡 Testing connection to %s... ", cfg.Backend)
	if err := internal.TestBackend(cfg.Backend); err != nil {
		fmt.Printf("FAILED\n   Error: %v\n", err)
	} else {
		fmt.Println("OK")
	}

	// 2. Check Git
	fmt.Print("🐙 Verifying git repository... ")
	if _, err := os.Stat(".git"); err != nil {
		fmt.Println("FAILED (Not a git repository)")
	} else {
		fmt.Println("OK")
	}

	// 3. Check Cache
	fmt.Print("💾 Checking rule cache... ")
	if _, err := os.Stat(".pg/cache/manifest.yaml"); err != nil {
		fmt.Println("MISSING (Run 'pg fetch')")
	} else {
		fmt.Println("OK")
	}

	return nil
}

func Completion(args []string) error {
	fmt.Println("# To enable bash completion, add this to your .bashrc:")
	fmt.Println("# complete -W \"init fetch scan check install version\" pg")
	return nil
}
