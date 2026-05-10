package cmd

import (
	"fmt"
)

const Version = "0.1.0"

func Execute(args []string) error {
	if len(args) == 0 {
		PrintUsage()
		return nil
	}

	if len(args) > 0 && (args[0] == "-v" || args[0] == "--version" || args[0] == "version") {
		fmt.Printf("pg version %s\n", Version)
		return nil
	}

	switch args[0] {
	case "init":
		return Init(args[1:])
	case "check":
		return Check(args[1:])
	case "fetch":
		return Fetch(args[1:])
	case "scan":
		return Scan(args[1:])
	case "install":
		return Install(args[1:])
	case "self-update":
		return SelfUpdate(args[1:])
	case "completion":
		return Completion(args[1:])
	default:
		PrintUsage()
		return fmt.Errorf("unknown command %q", args[0])
	}
}

func PrintUsage() {
	fmt.Println("pg is a git pre-push compliance CLI.")
	fmt.Println("\nUsage:")
	fmt.Println("  pg init      - bootstrap compliance in a new repository")
	fmt.Println("  pg fetch     - fetch scannable rules from backend")
	fmt.Println("  pg scan      - scan staged changes for violations")
	fmt.Println("  pg check     - verify environment and connectivity")
	fmt.Println("  pg install   - manually install the git pre-push hook")
	fmt.Println("  pg version   - show CLI version information")
	fmt.Println("\nFlags:")
	fmt.Println("  --backend URL   Backend base URL (overrides config)")
	fmt.Println("  --mode MODE     Scan mode: changes or full")
	fmt.Println("  --json          Output results in JSON format")
	fmt.Println("  -v, --version   Show version")
}
