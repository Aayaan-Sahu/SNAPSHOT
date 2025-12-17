package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/Aayaan-Sahu/SNAPSHOT/internal/auth"
	"github.com/Aayaan-Sahu/SNAPSHOT/internal/storage"
	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

var db *pgx.Conn
var s3Client *storage.S3Service

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

	http.Handle("/api/groups", auth.RequireAuth(http.HandlerFunc(handleGroups)))
	http.Handle("/api/groups/join", auth.RequireAuth(http.HandlerFunc(handleJoinGroup)))
	http.Handle("/api/groups/members", auth.RequireAuth(http.HandlerFunc(handleGetGroupMembers)))
	http.Handle("/api/groups/leave", auth.RequireAuth(http.HandlerFunc(handleLeaveGroup)))

	http.Handle("/api/friends", auth.RequireAuth(http.HandlerFunc(handleListFriends)))
	http.Handle("/api/friends/request", auth.RequireAuth(http.HandlerFunc(handleFriendRequest)))
	http.Handle("/api/friends/accept", auth.RequireAuth(http.HandlerFunc(handleAcceptFriend)))

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
