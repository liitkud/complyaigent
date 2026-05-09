package internal

import (
	"math"
	"regexp"
	"strings"
)

var entropyPattern = regexp.MustCompile(`[A-Za-z0-9+/=]{20,}`)

func ScanEntropy(diff string) []LocalViolation {
	violations := []LocalViolation{}
	lines := strings.Split(diff, "\n")

	for lineNum, line := range lines {
		if !strings.HasPrefix(line, "+") || strings.HasPrefix(line, "+++") {
			continue
		}

		for _, match := range entropyPattern.FindAllString(line, -1) {
			if isCommonToken(match) {
				continue
			}

			score := ScoreString(match)
			if score < 3.5 {
				continue
			}

			severity := "LOW"
			if score >= 7.0 {
				severity = "HIGH"
			} else if score >= 4.0 {
				severity = "MID"
			}

			redacted := match
			if len(redacted) > 20 {
				redacted = redacted[:20] + "..."
			}

			violations = append(violations, LocalViolation{
				Type:       "entropy",
				Pattern:    "high_entropy_string",
				File:       "unknown",
				Line:       lineNum,
				Severity:   severity,
				Redacted:   redacted,
				Confidence: score / 9.0,
			})
		}
	}

	return violations
}

func ScoreString(s string) float64 {
	counts := map[rune]float64{}
	for _, r := range s {
		counts[r]++
	}

	total := float64(len(s))
	entropy := 0.0
	for _, count := range counts {
		p := count / total
		entropy -= p * math.Log2(p)
	}

	const maxEntropy = 6.0
	score := (entropy / maxEntropy) * 9.0
	if score > 9.0 {
		score = 9.0
	}
	if score < 0 {
		score = 0
	}
	return score
}

func isCommonToken(token string) bool {
	common := []string{"aaaaaaaaaaaaaaaa", "12345678901234567890", "testtesttesttesttest"}
	for _, item := range common {
		if strings.Contains(token, item) {
			return true
		}
	}
	return false
}
