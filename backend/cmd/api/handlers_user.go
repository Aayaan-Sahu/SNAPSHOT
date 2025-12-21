package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/Aayaan-Sahu/SNAPSHOT/cmd/utils"
	"github.com/Aayaan-Sahu/SNAPSHOT/internal/auth"
)

func handleMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"message": "You are authenticated!", "user_id": "%s"}`, userID)
}

func handleGetUserStatus(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	currentSlot := utils.GetCurrentHourSlot()

	if !utils.IsValidSubmissionWindow(currentSlot) {
		json.NewEncoder(w).Encode(map[string]bool{"has_posted": false})
		return
	}

	var exists bool
	err := db.QueryRow(r.Context(),
		"SELECT EXISTS(SELECT 1 FROM photos WHERE user_id=$1 AND hour_timestamp=$2)",
		userID, currentSlot,
	).Scan(&exists)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]bool{"has_posted": exists})
}
