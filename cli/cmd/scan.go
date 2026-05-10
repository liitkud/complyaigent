package cmd

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/liitkud/complyaigent/cli/internal"
)

type ValidateRequest struct {
	CodeSnippet string `json:"code_snippet"`
	RuleID      string `json:"rule_id"`
	Context     string `json:"context,omitempty"`
}

type ValidateResponse struct {
	ValidationID   string `json:"validation_id"`
	Verdict        string `json:"verdict"`
	Reasoning      string `json:"reasoning"`
	ActivityLogged bool   `json:"activity_logged"`
}

func Scan(args []string) error {
	fs := flag.NewFlagSet("scan", flag.ContinueOnError)
	backend := fs.String("backend", "", "Backend base URL")
	mode := fs.String("mode", "", "Scan mode (changes|full)")
	jsonOutput := fs.Bool("json", false, "Output in JSON format")
	if err := fs.Parse(args); err != nil {
		return err
	}

	cfg, err := internal.LoadConfig(*backend, *mode)
	if err != nil {
		return err
	}

	if !*jsonOutput {
		fmt.Println("[*] ComplyAIgent scan")
	}

	diff, err := getGitDiff(cfg.Mode)
	if err != nil {
		return err
	}

	if strings.TrimSpace(diff) == "" {
		if *jsonOutput {
			fmt.Println(`{"verdict":"allow","reason":"No changes","violations":[]}`)
		} else {
			fmt.Println("✅ No violations. Push allowed.")
		}
		return nil
	}

	if !*jsonOutput {
		fmt.Printf("[✓] Diff size: %d bytes\n\n", len(diff))
		fmt.Println("[1] Running local scanning...")
	}

	gitleaksViolations, hasGitleaks, gitleaksErr := runGitleaks(diff, *jsonOutput)
	if gitleaksErr != nil && !*jsonOutput {
		fmt.Fprintf(os.Stderr, "⚠️  gitleaks warning: %v\n", gitleaksErr)
	}

	patternViolations := internal.ScanPatterns(diff, cfg)
	entropyViolations := internal.ScanEntropy(diff)

	allViolations := append(append(gitleaksViolations, patternViolations...), entropyViolations...)

	if len(allViolations) == 0 {
		if *jsonOutput {
			fmt.Println(`{"verdict":"allow","reason":"No patterns detected","violations":[]}`)
		} else {
			fmt.Println("✅ No violations. Push allowed.")
		}
		return nil
	}

	localVerdict, localReason := determineLocalVerdict(allViolations, hasGitleaks)
	if localVerdict == "block" {
		return executeVerdict("block", allViolations, localReason, *jsonOutput)
	}

	if localVerdict == "allow" {
		if !*jsonOutput {
			fmt.Println("⚠️  Low-risk findings detected, but allowed.")
		}
		return executeVerdict("allow", allViolations, localReason, *jsonOutput)
	}

	if !*jsonOutput {
		fmt.Println("\n[2] Consulting backend for uncertain findings...")
	}
	backendVerdict, backendViolations, backendReason, err := offloadToValidate(cfg.Backend, diff)
	if err != nil {
		if !*jsonOutput {
			fmt.Fprintf(os.Stderr, "⚠️  Backend unreachable (%v). Fail-closed.\n", err)
		}
		return executeVerdict("block", allViolations, "Backend unavailable; local violations detected", *jsonOutput)
	}

	return executeVerdict(backendVerdict, backendViolations, backendReason, *jsonOutput)
}

func getGitDiff(mode string) (string, error) {
	if _, err := exec.LookPath("git"); err != nil {
		return "", errors.New("git is not installed or not available in PATH")
	}

	args := []string{"diff", "--no-color", "--cached"}
	if mode == "full" {
		args = []string{"diff", "--no-color", "HEAD"}
	}

	output, err := exec.Command("git", args...).Output()
	if err != nil {
		return "", fmt.Errorf("git diff failed: %w", err)
	}
	return string(output), nil
}

func runGitleaks(diff string, jsonOutput bool) ([]internal.LocalViolation, bool, error) {
	if _, err := exec.LookPath("gitleaks"); err != nil {
		return nil, false, nil // Silent fail if gitleaks missing
	}

	cmd := exec.Command("gitleaks", "detect", "--source", "diff", "--json", "--exit-code", "0")
	cmd.Stdin = strings.NewReader(diff)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	_ = cmd.Run()

	if stderr.Len() > 0 {
		fmt.Fprintf(os.Stderr, "gitleaks: %s\n", strings.TrimSpace(stderr.String()))
	}

	if stdout.Len() == 0 {
		return nil, false, nil
	}

	var glResult struct {
		Findings []struct {
			RuleID   string `json:"RuleID"`
			Match    string `json:"Match"`
			FilePath string `json:"FilePath"`
			Line     int    `json:"Line"`
		} `json:"Findings"`
	}
	if err := json.Unmarshal(stdout.Bytes(), &glResult); err != nil {
		return nil, false, fmt.Errorf("unable to parse gitleaks output: %w", err)
	}

	violations := make([]internal.LocalViolation, 0, len(glResult.Findings))
	for _, f := range glResult.Findings {
		redacted := f.Match
		if len(redacted) > 20 {
			redacted = redacted[:20] + "..."
		}
		violations = append(violations, internal.LocalViolation{
			Type:       "secret",
			Pattern:    f.RuleID,
			File:       f.FilePath,
			Line:       f.Line,
			Severity:   "HIGH",
			Redacted:   redacted,
			Confidence: 0.95,
		})
	}

	return violations, len(violations) > 0, nil
}

func determineLocalVerdict(violations []internal.LocalViolation, hasGitleaks bool) (string, string) {
	hasHigh := false
	hasMid := false

	for _, v := range violations {
		switch strings.ToUpper(v.Severity) {
		case "HIGH", "CRITICAL":
			hasHigh = true
		case "MID", "MEDIUM":
			hasMid = true
		}
	}

	if hasGitleaks || hasHigh {
		return "block", "High-risk local findings"
	}
	if hasMid {
		return "uncertain", "Mid-risk findings require backend review"
	}
	return "allow", "Low-risk findings only"
}

func offloadToValidate(backendURL string, diff string) (string, []internal.LocalViolation, string, error) {
	repoName, committer := gitContext()
	req := ValidateRequest{
		CodeSnippet: diff,
		RuleID:      "auto",
		Context:     fmt.Sprintf("repo=%s,committer=%s", repoName, committer),
	}

	reqBody, err := json.Marshal(req)
	if err != nil {
		return "", nil, "", fmt.Errorf("encode validation request: %w", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(strings.TrimRight(backendURL, "/")+"/validate", "application/json", bytes.NewReader(reqBody))
	if err != nil {
		return "", nil, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", nil, "", fmt.Errorf("backend returned HTTP %d", resp.StatusCode)
	}

	var validation ValidateResponse
	if err := json.NewDecoder(resp.Body).Decode(&validation); err != nil {
		return "", nil, "", fmt.Errorf("parse backend response: %w", err)
	}

	return validation.Verdict, nil, validation.Reasoning, nil
}

func gitContext() (string, string) {
	repoName := "unknown"
	commitName := "unknown"

	if output, err := exec.Command("git", "rev-parse", "--show-toplevel").Output(); err == nil {
		repoName = filepath.Base(strings.TrimSpace(string(output)))
	}
	if output, err := exec.Command("git", "config", "user.name").Output(); err == nil {
		commitName = strings.TrimSpace(string(output))
	}

	return repoName, commitName
}

func executeVerdict(verdict string, violations []internal.LocalViolation, reason string, jsonOutput bool) error {
	if jsonOutput {
		result := struct {
			Verdict    string                    `json:"verdict"`
			Reason     string                    `json:"reason"`
			Violations []internal.LocalViolation `json:"violations"`
		}{
			Verdict:    verdict,
			Reason:     reason,
			Violations: violations,
		}
		out, _ := json.MarshalIndent(result, "", "  ")
		fmt.Println(string(out))
		if strings.ToLower(verdict) == "block" {
			return fmt.Errorf("push blocked")
		}
		return nil
	}

	switch strings.ToLower(verdict) {
	case "block":
		fmt.Println("❌ PUSH BLOCKED")
		fmt.Printf("Reason: %s\n\n", reason)
		printLocalViolations(violations)
		fmt.Println("\nTo override (not recommended):")
		fmt.Println("  git push --no-verify")
		return fmt.Errorf("push blocked")

	case "warn":
		fmt.Println("⚠️  WARNING")
		fmt.Printf("Reason: %s\n\n", reason)
		printLocalViolations(violations)
		fmt.Print("\nContinue anyway? (y/n): ")

		scanner := bufio.NewScanner(os.Stdin)
		scanner.Scan()
		answer := strings.TrimSpace(strings.ToLower(scanner.Text()))
		if answer == "y" || answer == "yes" {
			fmt.Println("✅ Push allowed (with warning)")
			return nil
		}
		return fmt.Errorf("push cancelled")

	case "allow":
		fmt.Println("✅ PUSH ALLOWED")
		fmt.Printf("Reason: %s\n", reason)
		printLocalViolations(violations)
		return nil

	default:
		return fmt.Errorf("unknown verdict: %s", verdict)
	}
}

func printLocalViolations(violations []internal.LocalViolation) {
	if len(violations) == 0 {
		return
	}
	fmt.Println("Violations:")
	for i, v := range violations {
		fmt.Printf("  %d. [%s] %s %s:%d (%s)\n", i+1, v.Severity, v.Redacted, v.File, v.Line, v.Pattern)
	}
}
