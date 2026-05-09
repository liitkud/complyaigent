package internal

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

type LocalViolation struct {
	Type       string  `json:"type"`
	Pattern    string  `json:"pattern"`
	File       string  `json:"file"`
	Line       int     `json:"line"`
	Severity   string  `json:"severity"`
	Redacted   string  `json:"redacted"`
	Confidence float64 `json:"confidence"`
}

type ScannableRule struct {
	ID          string `yaml:"id" json:"id"`
	Name        string `yaml:"name" json:"name"`
	Regex       string `yaml:"regex" json:"regex"`
	Severity    string `yaml:"severity" json:"severity"`
	Remediation string `yaml:"remediation" json:"remediation"`
}

type ManifestRule struct {
	ID          string `yaml:"id" json:"id"`
	RuleName    string `yaml:"rule_name" json:"rule_name"`
	Pattern     string `yaml:"pattern" json:"pattern"`
	Remediation string `yaml:"remediation" json:"remediation"`
	Logic       string `yaml:"logic" json:"logic"`
	TestPass    string `yaml:"test_pass" json:"test_pass"`
	TestFail    string `yaml:"test_fail" json:"test_fail"`
}

type ManifestResponse struct {
	Buckets map[string][]ManifestRule `yaml:"buckets" json:"buckets"`
}

type BuiltinManifest struct {
	Patterns []ScannableRule `yaml:"patterns" json:"patterns"`
}

var builtinPatterns = []ScannableRule{
	{
		ID:          "aws_key",
		Name:        "AWS Access Key",
		Regex:       `AKIA[0-9A-Z]{16}`,
		Severity:    "HIGH",
		Remediation: "Remove the key from source control and rotate it immediately.",
	},
	{
		ID:          "private_key",
		Name:        "Private Key",
		Regex:       `-----BEGIN (RSA )?PRIVATE KEY-----`,
		Severity:    "HIGH",
		Remediation: "Avoid committing private key material to git.",
	},
	{
		ID:          "hardcoded_password",
		Name:        "Hardcoded Password",
		Regex:       `(?i)(password|passwd|pwd)\s*=\s*["']([^"']+)["']`,
		Severity:    "MID",
		Remediation: "Move secrets into environment variables or a vault.",
	},
	{
		ID:          "api_key",
		Name:        "API Key",
		Regex:       `(?i)(api[_-]?key|apikey)\s*=\s*["']?([A-Za-z0-9_-]{20,})["']?`,
		Severity:    "MID",
		Remediation: "Store API keys outside of source control.",
	},
}

func FetchAndCacheRules(backendURL, manifestPath, builtinPath string) (int, int, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	url := strings.TrimRight(backendURL, "/") + "/reg?bucket=A1"
	resp, err := client.Get(url)
	if err != nil {
		return 0, 0, fmt.Errorf("fetch rules from backend: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, 0, fmt.Errorf("backend returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, 0, fmt.Errorf("read backend response: %w", err)
	}

	var remote ManifestResponse
	if err := json.Unmarshal(body, &remote); err != nil {
		return 0, 0, fmt.Errorf("parse backend response: %w", err)
	}

	if err := writeYAMLFile(manifestPath, remote); err != nil {
		return 0, 0, err
	}

	if err := writeYAMLFile(builtinPath, BuiltinManifest{Patterns: builtinPatterns}); err != nil {
		return 0, 0, err
	}

	ruleCount := 0
	for _, items := range remote.Buckets {
		ruleCount += len(items)
	}

	return ruleCount, len(builtinPatterns), nil
}

func LoadScannablePatterns(manifestPath, builtinPath string) ([]ScannableRule, error) {
	var patterns []ScannableRule
	if _, err := os.Stat(manifestPath); err == nil {
		manifestRules, err := loadManifestRules(manifestPath)
		if err == nil {
			patterns = append(patterns, manifestRules...)
		}
	}

	if _, err := os.Stat(builtinPath); err == nil {
		builtinRules, err := loadBuiltinRules(builtinPath)
		if err == nil {
			patterns = append(patterns, builtinRules...)
		}
	}

	if len(patterns) == 0 {
		patterns = hardcodedPatterns()
	}

	return patterns, nil
}

func loadManifestRules(path string) ([]ScannableRule, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var resp ManifestResponse
	if err := yaml.Unmarshal(data, &resp); err != nil {
		return nil, fmt.Errorf("invalid manifest YAML: %w", err)
	}

	rules := make([]ScannableRule, 0)
	for _, bucketRules := range resp.Buckets {
		for _, item := range bucketRules {
			if strings.ToUpper(item.Logic) != "REGEX" || item.Pattern == "" {
				continue
			}
			rules = append(rules, ScannableRule{
				ID:          item.ID,
				Name:        item.RuleName,
				Regex:       item.Pattern,
				Severity:    "HIGH",
				Remediation: item.Remediation,
			})
		}
	}

	return rules, nil
}

func loadBuiltinRules(path string) ([]ScannableRule, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var manifest BuiltinManifest
	if err := yaml.Unmarshal(data, &manifest); err != nil {
		return nil, fmt.Errorf("invalid builtin YAML: %w", err)
	}
	return manifest.Patterns, nil
}

func ScanPatterns(diff string, cfg Config) []LocalViolation {
	patterns, _ := LoadScannablePatterns(filepath.Join(".pg", "cache", "manifest.yaml"), filepath.Join(".pg", "cache", "builtin.yaml"))
	if len(patterns) == 0 {
		return nil
	}

	compiled := make([]struct {
		rule ScannableRule
		re   *regexp.Regexp
	}, 0, len(patterns))

	for _, rule := range patterns {
		re, err := regexp.Compile(rule.Regex)
		if err != nil {
			continue
		}
		compiled = append(compiled, struct {
			rule ScannableRule
			re   *regexp.Regexp
		}{rule: rule, re: re})
	}

	lines := parseDiff(diff)
	violations := []LocalViolation{}
	for _, line := range lines {
		if shouldExcludePath(line.File, cfg.Exclude) {
			continue
		}

		for _, item := range compiled {
			if match := item.re.FindString(line.Text); match != "" {
				redacted := match
				if len(redacted) > 20 {
					redacted = redacted[:20] + "..."
				}
				severity := strings.ToUpper(item.rule.Severity)
				if severity == "" {
					severity = "HIGH"
				}
				violations = append(violations, LocalViolation{
					Type:       "pattern",
					Pattern:    item.rule.Name,
					File:       line.File,
					Line:       line.Line,
					Severity:   severity,
					Redacted:   redacted,
					Confidence: 0.80,
				})
			}
		}
	}

	return violations
}

type diffLine struct {
	File string
	Line int
	Text string
}

func parseDiff(diff string) []diffLine {
	lines := strings.Split(diff, "\n")
	var currentFile string
	var currentLine int
	parsed := make([]diffLine, 0)

	reHunk := regexp.MustCompile(`@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@`)

	for _, raw := range lines {
		if strings.HasPrefix(raw, "+++ b/") {
			currentFile = strings.TrimPrefix(raw, "+++ b/")
			continue
		}
		if strings.HasPrefix(raw, "@@") {
			matches := reHunk.FindStringSubmatch(raw)
			if len(matches) == 2 {
				currentLine = atoi(matches[1]) - 1
			}
			continue
		}
		if strings.HasPrefix(raw, "+") && !strings.HasPrefix(raw, "+++") {
			currentLine++
			if currentFile == "" {
				continue
			}
			parsed = append(parsed, diffLine{File: currentFile, Line: currentLine, Text: strings.TrimPrefix(raw, "+")})
			continue
		}
		if strings.HasPrefix(raw, "-") && !strings.HasPrefix(raw, "---") {
			continue
		}
		if strings.HasPrefix(raw, " ") {
			currentLine++
		}
	}

	return parsed
}

func atoi(value string) int {
	i, _ := strconv.Atoi(value)
	return i
}

func shouldExcludePath(filePath string, exclude ExcludeConfig) bool {
	for _, pattern := range exclude.Files {
		if match, _ := filepath.Match(pattern, filepath.Base(filePath)); match {
			return true
		}
	}

	for _, path := range exclude.Paths {
		if strings.HasPrefix(filePath, strings.TrimSuffix(path, "/")) {
			return true
		}
	}

	return false
}

func hardcodedPatterns() []ScannableRule {
	return []ScannableRule{
		{
			ID:          "hardcoded_password",
			Name:        "Hardcoded Password",
			Regex:       `(?i)(password|passwd|pwd)\s*=\s*["']([^"']+)["']`,
			Severity:    "MID",
			Remediation: "Move secrets into environment variables.",
		},
		{
			ID:          "api_key",
			Name:        "API Key",
			Regex:       `(?i)(api[_-]?key|apikey)\s*=\s*["']?([A-Za-z0-9_-]{20,})["']?`,
			Severity:    "MID",
			Remediation: "Store API keys outside of source control.",
		},
	}
}

func writeYAMLFile(path string, value interface{}) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("create directory: %w", err)
	}
	data, err := yaml.Marshal(value)
	if err != nil {
		return fmt.Errorf("encode YAML: %w", err)
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("write file %s: %w", path, err)
	}
	return nil
}
