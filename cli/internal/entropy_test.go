package internal

import "testing"

func TestScanEntropyDetectsAddedHighEntropyToken(t *testing.T) {
	diff := "+++ b/config.env\n@@ -1 +1 @@\n+TOKEN=Q7vx9Kp2Lm4Rs8Yt1Nc6Zd3\n"

	violations := ScanEntropy(diff)
	if len(violations) != 1 {
		t.Fatalf("ScanEntropy() returned %d violations, want 1", len(violations))
	}
	if violations[0].Type != "entropy" || violations[0].File != "unknown" {
		t.Errorf("violation = %#v, want entropy finding with unknown file", violations[0])
	}
}

func TestScoreStringIsHigherForVariedInput(t *testing.T) {
	repeated := ScoreString("aaaaaaaaaaaaaaaaaaaa")
	varied := ScoreString("aB3$xY7!mN2@qR8#")
	if repeated >= varied {
		t.Errorf("repeated score %v >= varied score %v", repeated, varied)
	}
}
