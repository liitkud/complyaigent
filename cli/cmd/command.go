package cmd

import (
	"fmt"
)

func Execute(args []string) error {
	if len(args) == 0 {
		PrintUsage()
		return nil
	}

	switch args[0] {
	case "fetch":
		return Fetch(args[1:])
	case "scan":
		return Scan(args[1:])
	case "install":
		return Install(args[1:])
	default:
		PrintUsage()
		return fmt.Errorf("unknown command %q", args[0])
	}
}

func PrintUsage() {
	fmt.Println("pg is a git pre-push compliance CLI.")
	fmt.Println("Usage:")
	fmt.Println("  pg fetch    - fetch scannable rules from backend")
	fmt.Println("  pg scan     - scan staged changes")
	fmt.Println("  pg install  - install the git pre-push hook")
	fmt.Println()
	fmt.Println("Flags:")
	fmt.Println("  --backend URL   Backend base URL (overrides config)")
	fmt.Println("  --mode MODE     Scan mode: changes or full")
}
