package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

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
	IDToken string `json:"idToken"`
}

type GoogleTokenInfo struct {
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Sub           string `json:"sub"`

	Aud string `json:"aud"`
	Iss string `json:"iss"`
}

func handleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GoogleLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.IDToken == "" {
		http.Error(w, "Missing idToken", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	tokenInfoURL := "https://oauth2.googleapis.com/tokeninfo?id_token=" + url.QueryEscape(req.IDToken)
	httpClient := &http.Client{Timeout: 15 * time.Second}

	reqGoogle, err := http.NewRequestWithContext(ctx, http.MethodGet, tokenInfoURL, nil)
	if err != nil {
		http.Error(w, "Failed to build Google request", http.StatusInternalServerError)
		return
	}

	resp, err := httpClient.Do(reqGoogle)
	if err != nil {
		fmt.Printf("Google tokeninfo request error: %v\n", err)
		http.Error(w, "Failed to validate token with Google", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		fmt.Printf("Google tokeninfo non-200: %d body=%s\n", resp.StatusCode, string(bodyBytes))
		http.Error(w, "Invalid Google Token", http.StatusUnauthorized)
		return
	}

	var g GoogleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&g); err != nil {
		http.Error(w, "Failed to parse Google response", http.StatusInternalServerError)
		return
	}

	if g.Iss != "https://accounts.google.com" && g.Iss != "accounts.google.com" {
		http.Error(w, "Invalid token issuer", http.StatusUnauthorized)
		return
	}

	iosClientID := os.Getenv("GOOGLE_IOS_CLIENT_ID")

	audOK := false
	if iosClientID != "" && g.Aud == iosClientID {
		audOK = true
	}
	if !audOK {
		http.Error(w, "Invalid token audience", http.StatusUnauthorized)
		return
	}

	if g.EmailVerified != "true" {
		http.Error(w, "Google email not verified", http.StatusUnauthorized)
		return
	}

	if g.Sub == "" || g.Email == "" {
		http.Error(w, "Invalid Google token payload", http.StatusUnauthorized)
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
		RETURNING id;
	`
	if err := db.QueryRow(r.Context(), query, g.Email, g.Name, g.Picture, g.Sub).Scan(&userID); err != nil {
		fmt.Printf("Database error: %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	token, err := auth.GenerateToken(auth.TokenPayload{
		UserID:  userID,
		Email:   g.Email,
		Name:    g.Name,
		Picture: g.Picture,
		Role:    "user",
	})
	if err != nil {
		fmt.Printf("GenerateToken error: %v\n", err)
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"user": map[string]string{
			"id":      userID,
			"email":   g.Email,
			"name":    g.Name,
			"picture": g.Picture,
		},
	})
}
