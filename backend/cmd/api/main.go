package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/Aayaan-Sahu/SNAPSHOT/internal/auth"
	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
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

	http.Handle("/api/groups", auth.RequireAuth(http.HandlerFunc(handleGroups)))
	http.Handle("/api/groups/join", auth.RequireAuth(http.HandlerFunc(handleJoinGroup)))

	http.Handle("/api/friends", auth.RequireAuth(http.HandlerFunc(handleListFriends)))
	http.Handle("/api/friends/request", auth.RequireAuth(http.HandlerFunc(handleFriendRequest)))
	http.Handle("/api/friends/accept", auth.RequireAuth(http.HandlerFunc(handleAcceptFriend)))

	fmt.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
