package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/Aayaan-Sahu/SNAPSHOT/internal/auth"
	"github.com/Aayaan-Sahu/SNAPSHOT/internal/storage"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

var db *pgxpool.Pool
var s3Client *storage.S3Service

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	auth.Init()

	var err error
	db, err = pgxpool.New(context.Background(), os.Getenv("DB_URL"))
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close()
	fmt.Println("Connected to Postgres!")

	// public routes
	http.HandleFunc("/auth/login", handleLogin)
	http.HandleFunc("/auth/callback", handleCallback)
	http.HandleFunc("/auth/google", handleGoogleLogin)

	http.HandleFunc("/api/ping", handlePing)

	// protected routes
	http.Handle("/api/me", auth.RequireAuth(http.HandlerFunc(handleMe)))
	http.Handle("/api/user/status", auth.RequireAuth(http.HandlerFunc(handleGetUserStatus)))

	http.Handle("/api/groups", auth.RequireAuth(http.HandlerFunc(handleGroups)))
	http.Handle("/api/groups/join", auth.RequireAuth(http.HandlerFunc(handleJoinGroup)))
	http.Handle("/api/groups/members", auth.RequireAuth(http.HandlerFunc(handleGetGroupMembers)))
	http.Handle("/api/groups/leave", auth.RequireAuth(http.HandlerFunc(handleLeaveGroup)))

	http.Handle("/api/friends", auth.RequireAuth(http.HandlerFunc(handleListFriends)))
	http.Handle("/api/friends/request", auth.RequireAuth(http.HandlerFunc(handleFriendRequest)))
	http.Handle("/api/friends/accept", auth.RequireAuth(http.HandlerFunc(handleAcceptFriend)))
	http.Handle("/api/friends/reject", auth.RequireAuth(http.HandlerFunc(handleRejectFriend)))
	http.Handle("/api/friends/cancel", auth.RequireAuth(http.HandlerFunc(handleCancelFriendRequest)))
	http.Handle("/api/friends/requests/incoming", auth.RequireAuth(http.HandlerFunc(handleListIncomingFriendRequests)))
	http.Handle("/api/friends/requests/outgoing", auth.RequireAuth(http.HandlerFunc(handleListOutgoingFriendRequests)))

	s3Client, err = storage.NewS3Service()
	if err != nil {
		log.Fatalf("Failed to initialize S3: %v", err)
	} else {
		log.Println("S3 Service initialized successfully")
	}

	http.Handle("/api/photos/upload-url", auth.RequireAuth(http.HandlerFunc(handleGetUploadURL)))
	http.Handle("/api/photos", auth.RequireAuth(http.HandlerFunc(handleConfirmPhoto)))
	http.Handle("/api/photos/slideshow", auth.RequireAuth(http.HandlerFunc(handleGetSlideshow)))

	fmt.Println("Server running on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}

func handlePing(w http.ResponseWriter, r *http.Request) {
	// Log the headers so we can see if the Token arrived (Test 2)
	fmt.Printf("[PING] Request received from: %s\n", r.RemoteAddr)
	fmt.Printf("[PING] Auth Header: %s\n", r.Header.Get("Authorization"))

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status": "ok", "message": "Pong!"}`))
}
