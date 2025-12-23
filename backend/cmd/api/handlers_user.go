package main

import (
	"encoding/json"
	"net/http"

	"github.com/Aayaan-Sahu/SNAPSHOT/cmd/utils"
	"github.com/Aayaan-Sahu/SNAPSHOT/internal/auth"
	"github.com/jackc/pgx/v5"
)

type UserResponse struct {
	ID      string  `json:"id"`
	Email   string  `json:"email"`
	Name    string  `json:"name"`
	Picture *string `json:"picture"`
}

func handleMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	var user UserResponse
	err := db.QueryRow(r.Context(),
		"SELECT id, email, name, picture FROM users WHERE id = $1",
		userID,
	).Scan(&user.ID, &user.Email, &user.Name, &user.Picture)
	if err == pgx.ErrNoRows {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(user); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
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
