package main

import (
	"fmt"
	"net/http"

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
