package utils

import "time"

const SubmissionWindowDuration = 10 * time.Minute

func GetCurrentHourSlot() time.Time {
	return time.Now().UTC().Truncate(time.Hour)
}

func IsValidSubmissionWindow(slot time.Time) bool {
	now := time.Now().UTC()
	deadline := slot.Add(SubmissionWindowDuration)

	if now.Before(slot) {
		return false
	}
	if now.After(deadline) {
		return false
	}
	return true
}
