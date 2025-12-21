package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/Aayaan-Sahu/SNAPSHOT/internal/auth"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

type FriendRequestInput struct {
	TargetEmail string `json:"target_email"`
}

func handleFriendRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	requesterID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req FriendRequestInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	req.TargetEmail = strings.TrimSpace(strings.ToLower(req.TargetEmail))
	if req.TargetEmail == "" {
		http.Error(w, "target_email is required", http.StatusBadRequest)
		return
	}
	fmt.Print(req.TargetEmail)

	var targetID string
	err := db.QueryRow(r.Context(), "SELECT id FROM users WHERE email = $1", req.TargetEmail).Scan(&targetID)
	if err == pgx.ErrNoRows {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if requesterID == targetID {
		http.Error(w, "You cannot friend yourself", http.StatusBadRequest)
		return
	}

	userA, userB := requesterID, targetID
	if requesterID > targetID {
		userA, userB = targetID, requesterID
	}

	_, err = db.Exec(r.Context(),
		`INSERT INTO friendships (user_a_id, user_b_id, status, requester_id)
		 VALUES ($1, $2, 'pending', $3)`,
		userA, userB, requesterID,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			http.Error(w, "Friendship status already exists (pending or accepted)", http.StatusConflict)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"status":    "request_sent",
		"target_id": targetID,
	})
}

type FriendAcceptInput struct {
	TargetID string `json:"target_id"`
}

func handleAcceptFriend(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	acceptorID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req FriendAcceptInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	if req.TargetID == "" {
		http.Error(w, "target_id is required", http.StatusBadRequest)
	}

	userA, userB := acceptorID, req.TargetID
	if acceptorID > req.TargetID {
		userA, userB = req.TargetID, acceptorID
	}

	commandTag, err := db.Exec(r.Context(),
		`UPDATE friendships
		 SET status = 'accepted', requester_id = $1
		 WHERE user_a_id = $2 AND user_b_id = $3
		 AND status = 'pending'
		 AND requester_id != $1`,
		acceptorID, userA, userB,
	)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if commandTag.RowsAffected() == 0 {
		http.Error(w, "No pending request found from this user", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "friendship_accepted",
	})
}

type Friend struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func handleListFriends(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := `
		SELECT u.id, u.name, u.picture
		FROM friendships f
		JOIN users u ON u.id = CASE
			WHEN f.user_a_id = $1 THEN f.user_b_id
			ELSE f.user_a_id
		END
		WHERE (f.user_a_id = $1 OR f.user_b_id = $1)
		AND f.status = 'accepted'
		ORDER BY lower(u.name) ASC
	`

	rows, err := db.Query(r.Context(), query, userID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	friends := make([]Friend, 0)
	for rows.Next() {
		var f Friend
		if err := rows.Scan(&f.ID, &f.Name, &f.Picture); err != nil {
			continue
		}
		friends = append(friends, f)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"friends": friends,
	})
}

type FriendRejectInput struct {
	TargetID string `json:"target_id"`
}

func handleRejectFriend(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rejectorID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req FriendRejectInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	req.TargetID = strings.TrimSpace(req.TargetID)
	if req.TargetID == "" {
		http.Error(w, "target_id is required", http.StatusBadRequest)
		return
	}

	userA, userB := rejectorID, req.TargetID
	if rejectorID > req.TargetID {
		userA, userB = req.TargetID, rejectorID
	}

	commandTag, err := db.Exec(r.Context(),
		`DELETE FROM friendships
		 WHERE user_a_id = $1 AND user_b_id = $2
		 AND requester_id != $3`,
		userA, userB, rejectorID,
	)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if commandTag.RowsAffected() == 0 {
		http.Error(w, "No pending incoming request found from this user", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "friendship_rejected",
	})
}

type FriendCancelInput struct {
	TargetID string `json:"target_id"`
}

func handleCancelFriendRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cancelerID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req FriendCancelInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	req.TargetID = strings.TrimSpace(req.TargetID)
	if req.TargetID == "" {
		http.Error(w, "target_id is required", http.StatusBadRequest)
		return
	}

	userA, userB := cancelerID, req.TargetID
	if cancelerID > req.TargetID {
		userA, userB = req.TargetID, cancelerID
	}

	commandTag, err := db.Exec(r.Context(),
		`DELETE FROM friendships
		 WHERE user_a_id = $1 AND user_b_id = $2
		 AND status = 'pending'
		 AND requester_id = $3`,
		userA, userB, cancelerID,
	)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if commandTag.RowsAffected() == 0 {
		http.Error(w, "No pending outgoing request found to this user", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "request_canceled",
	})
}

type PendingRequest struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func handleListIncomingFriendRequests(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := `
		SELECT u.id, u.email, u.name, u.picture
		FROM friendships f
		JOIN users u ON u.id = f.requester_id
		WHERE f.status = 'pending'
			AND (f.user_a_id = $1 OR f.user_b_id = $1)
			AND f.requester_id != $1
		ORDER by lower(coalesce(u.name, u.email)) ASC
	`

	rows, err := db.Query(r.Context(), query, userID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	requests := make([]PendingRequest, 0)
	for rows.Next() {
		var pr PendingRequest
		if err := rows.Scan(&pr.ID, &pr.Email, &pr.Name, &pr.Picture); err != nil {
			continue
		}
		requests = append(requests, pr)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"incoming_requests": requests,
	})
}

func handleListOutgoingFriendRequests(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := `
		SELECT u.id, u.email, u.name, u.picture
		FROM friendships f
		JOIN users u ON u.id = CASE
			WHEN f.user_a_id = $1 THEN f.user_b_id
			ELSE f.user_a_id
		END
		WHERE f.status = 'pending'
			AND f.requester_id = $1
			AND (f.user_a_id = $1 OR f.user_b_id = $1)	
		ORDER BY lower(coalesce(u.name, u.email)) ASC
	`

	rows, err := db.Query(r.Context(), query, userID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	requests := make([]PendingRequest, 0)
	for rows.Next() {
		var pr PendingRequest
		if err := rows.Scan(&pr.ID, &pr.Email, &pr.Name, &pr.Picture); err != nil {
			continue
		}
		requests = append(requests, pr)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"outgoing_requests": requests,
	})
}

type FriendRemoveInput struct {
	TargetID string `json:"target_id"`
}

func handleRemoveFriend(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
	}

	var req FriendRemoveInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	if req.TargetID == "" {
		http.Error(w, "target_id is required", http.StatusBadRequest)
		return
	}

	userA, userB := userID, req.TargetID
	if userID > req.TargetID {
		userA, userB = req.TargetID, userID
	}

	result, err := db.Exec(r.Context(),
		`DELETE FROM friendships
		 WHERE user_a_id = $1 AND user_b_id = $2
		 AND status = 'accepted'`,
		userA, userB,
	)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "Friendship not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "friend_removed",
	})
}
