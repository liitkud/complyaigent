package cmd

import (
	"testing"

	"github.com/liitkud/complyaigent/cli/internal"
)

func TestDetermineLocalVerdictPrioritizesHighSeverity(t *testing.T) {
	violations := []internal.LocalViolation{
		{Severity: "MID"},
		{Severity: "HIGH"},
	}

	verdict, reason := determineLocalVerdict(violations, false)
	if verdict != "block" || reason != "High-risk local findings" {
		t.Fatalf("determineLocalVerdict() = %q, %q, want block, high-risk reason", verdict, reason)
	}
}

func TestDetermineLocalVerdictAllowsLowSeverity(t *testing.T) {
	verdict, reason := determineLocalVerdict([]internal.LocalViolation{{Severity: "LOW"}}, false)
	if verdict != "allow" || reason != "Low-risk findings only" {
		t.Fatalf("determineLocalVerdict() = %q, %q, want allow, low-risk reason", verdict, reason)
	}
}
