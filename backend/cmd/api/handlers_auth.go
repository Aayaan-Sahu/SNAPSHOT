package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/Aayaan-Sahu/SNAPSHOT/internal/auth"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/oauth2"
)

func handleLogin(w http.ResponseWriter, r *http.Request) {
	url := auth.GoogleOauthConfig.AuthCodeURL("random-state-string", oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func handleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")

	googleUser, err := auth.GetGoogleUser(code)
	if err != nil {
		http.Error(w, "Failed to get user info", http.StatusInternalServerError)
		return
	}

	var userID string
	err = db.QueryRow(context.Background(),
		"SELECT id FROM users WHERE google_sub = $1",
		googleUser.ID,
	).Scan(&userID)

	if err == pgx.ErrNoRows {
		newID, _ := uuid.NewV7()
		userID = newID.String()

		_, err = db.Exec(context.Background(),
			"INSERT INTO users (id, google_sub, email, name, picture, timezone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)",
			userID, googleUser.ID, googleUser.Email, googleUser.Name, googleUser.Picture, "UTC", "user",
		)
		if err != nil {
			http.Error(w, "Error creating user: "+err.Error(), http.StatusInternalServerError)
			return
		}
	} else if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	} else {
		_, err = db.Exec(context.Background(),
			"UPDATE users SET email = $1, picture = $2 WHERE id = $3",
			googleUser.Email, googleUser.Picture, userID,
		)
		if err != nil {
			log.Printf("Failed to update user info: %v", err)
		}
	}

	token, err := auth.GenerateToken(auth.TokenPayload{
		UserID:  userID,
		Email:   googleUser.Email,
		Name:    googleUser.Name,
		Picture: googleUser.Picture,
		Role:    "user",
	})
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{
		"token":   token,
		"user_id": userID,
		"status":  "success",
	}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

type GoogleLoginRequest struct {
	IDToken string `json:"id_token"`
}

type GoogleTokenInfo struct {
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Sub           string `json:"sub"`
}

func handleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}

	fmt.Print("Entering the google login endpoint")

	var req GoogleLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	resp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + req.IDToken)
	if err != nil {
		http.Error(w, "Failed to validate token with Google", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		http.Error(w, "Invalid Google Token", http.StatusUnauthorized)
		return
	}

	var googleUser GoogleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		http.Error(w, "Failed to parse Google response", http.StatusInternalServerError)
		return
	}

	var userID string
	query := `
		INSERT INTO users (id, email, name, picture, google_sub, role)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, 'user')
		ON CONFLICT (email) DO UPDATE
		SET name = EXCLUDED.name,
			picture = EXCLUDED.picture,
			google_sub = EXCLUDED.google_sub
		RETURNING id`

	err = db.QueryRow(r.Context(), query,
		googleUser.Email,
		googleUser.Name,
		googleUser.Picture,
		googleUser.Sub,
	).Scan(&userID)
	if err != nil {
		fmt.Printf("Database Error: %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	token, err := auth.GenerateToken(auth.TokenPayload{
		UserID:  userID,
		Email:   googleUser.Email,
		Name:    googleUser.Name,
		Picture: googleUser.Picture,
		Role:    "user",
	})
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"user": map[string]string{
			"id":      userID,
			"email":   googleUser.Email,
			"name":    googleUser.Name,
			"picture": googleUser.Picture,
		},
	})
}
