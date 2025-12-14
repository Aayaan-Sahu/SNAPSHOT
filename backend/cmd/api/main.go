package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/Aayaan-Sahu/SNAPSHOT/internal/auth"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
)

var db *pgx.Conn

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	auth.Init()

	var err error
	db, err = pgx.Connect(context.Background(), os.Getenv("DB_URL"))
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close(context.Background())
	fmt.Println("Connected to Postgres!")

	// public routes
	http.HandleFunc("/auth/login", handleLogin)
	http.HandleFunc("/auth/callback", handleCallback)

	// protected routes
	http.Handle("/api/me", auth.RequireAuth(http.HandlerFunc(handleMe)))

	fmt.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

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

func handleMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"message": "You are authenticated!", "user_id": "%s"}`, userID)
}
