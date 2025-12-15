package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/Aayaan-Sahu/SNAPSHOT/internal/auth"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

type CreateGroupRequest struct {
	Name string `json:"name"`
}

type Group struct {
	ID      string `json:"id"`
	OwnerID string `json:"owner_id"`
	Name    string `json:"name"`
}

func handleGroups(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		handleListGroups(w, r)
	case http.MethodPost:
		createGroup(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleListGroups(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := db.Query(r.Context(),
		`SELECT g.id, g.owner_id, g.name
		 FROM groups g
		 JOIN group_members gm ON g.id = gm.group_id
		 WHERE gm.user_id = $1
		 ORDER BY g.name ASC`,
		userID,
	)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	groups := make([]Group, 0)

	for rows.Next() {
		var g Group
		if err := rows.Scan(&g.ID, &g.OwnerID, &g.Name); err != nil {
			continue
		}
		groups = append(groups, g)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "Database iteration error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"groups": groups,
	})
}

func createGroup(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateGroupRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		http.Error(w, "Group name is required", http.StatusBadRequest)
		return
	}

	if len(req.Name) > 100 {
		http.Error(w, "Group name too long (max 100 characters", http.StatusBadRequest)
		return
	}

	groupID, _ := uuid.NewV7()

	// start a transaction (all or nothing)
	tx, err := db.Begin(r.Context())
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer func() { _ = tx.Rollback(r.Context()) }()

	// insert group into groups
	_, err = tx.Exec(
		r.Context(),
		"INSERT INTO groups (id, owner_id, name) VALUES ($1, $2, $3)",
		groupID, userID, req.Name,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			http.Error(w, "You already have a group with this name", http.StatusConflict)
			return
		}
		http.Error(w, "Failed to create group", http.StatusInternalServerError)
		return
	}

	// automatically add user into group
	_, err = tx.Exec(
		r.Context(),
		"INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
		groupID, userID,
	)
	if err != nil {
		http.Error(w, "Failed to join group", http.StatusInternalServerError)
		return
	}

	// handle all errors
	if err := tx.Commit(r.Context()); err != nil {
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	// return success
	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]Group{
		"group": {
			ID:      groupID.String(),
			OwnerID: userID,
			Name:    req.Name,
		},
	})
}

type JoinGroupRequest struct {
	GroupID string `json:"group_id"`
}

func handleJoinGroup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req JoinGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "hella Invalid request body", http.StatusBadRequest)
		return
	}
	if req.GroupID == "" {
		http.Error(w, "group_id is required", http.StatusBadRequest)
		return
	}

	_, err := db.Exec(r.Context(),
		"INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)",
		req.GroupID, userID,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" {
				http.Error(w, "You are already a member of this group", http.StatusConflict)
				return
			}
			if pgErr.Code == "23503" {
				http.Error(w, "Group not found", http.StatusNotFound)
				return
			}
		}
		log.Printf("Join Group Error: %v", err)
		http.Error(w, "Failed to join group", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":   "success",
		"group_id": req.GroupID,
		"user_id":  userID,
	})
}
