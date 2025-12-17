package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Aayaan-Sahu/SNAPSHOT/cmd/utils"
	"github.com/Aayaan-Sahu/SNAPSHOT/internal/auth"
	"github.com/jackc/pgx/v5/pgconn"
)

func handleGetUploadURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	currentSlot := utils.GetCurrentHourSlot()
	if !utils.IsValidSubmissionWindow(currentSlot) {
		http.Error(w, "Submission window closed for this hour", http.StatusForbidden)
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
	if exists {
		http.Error(w, "You have already taken a photo for this hour", http.StatusConflict)
		return
	}

	dateStr := currentSlot.Format("2006-01-02")
	hourStr := currentSlot.Format("15")
	key := fmt.Sprintf("uploads/%s/%s/%s.jpg", userID, dateStr, hourStr)

	uploadURL, err := s3Client.GeneratePresignedUploadURL(key)
	if err != nil {
		http.Error(w, "Failed to generate upload ticket", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"upload_url":     uploadURL,
		"key":            key,
		"slot_timestamp": currentSlot.Format(time.RFC3339),
	})
}

type ConfirmPhotoRequest struct {
	Key           string `json:"key"`
	SlotTimeStamp string `json:"slot_timestamp"`
}

func handleConfirmPhoto(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req ConfirmPhotoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	// security check
	if !strings.Contains(req.Key, userID) {
		http.Error(w, "Invalid key: You can only confirm your own uploads", http.StatusForbidden)
		return
	}

	// parse timestamp
	slotTime, err := time.Parse(time.RFC3339, req.SlotTimeStamp)
	if err != nil {
		http.Error(w, "Invalid timestamp format", http.StatusBadRequest)
		return
	}

	// database insert
	_, err = db.Exec(r.Context(),
		`INSERT INTO photos (user_id, s3_key, bucket, hour_timestamp)
		 VALUES ($1, $2, $3, $4)`,
		userID, req.Key, s3Client.BucketName, slotTime,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			w.WriteHeader(http.StatusOK)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "photo_confirmed"})
}

type PhotoSlot struct {
	Hour   int     `json:"hour"`
	Status string  `json:"status"` // taken or missed
	URL    *string `json:"url"`
}

type UserTimeline struct {
	UserID   string      `json:"user_id"`
	Name     string      `json:"name"`
	Avatar   *string     `json:"avatar"`
	Timeline []PhotoSlot `json:"timeline"`
}

func handleGetSlideshow(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := auth.GetUserID(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	groupID := r.URL.Query().Get("group_id")
	if groupID == "" {
		http.Error(w, "group_id required", http.StatusBadRequest)
		return
	}

	// ensure requester is in group
	var inGroup bool
	err := db.QueryRow(r.Context(),
		"SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2)",
		groupID, userID,
	).Scan(&inGroup)
	if err != nil || !inGroup {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// get all group members
	rows, err := db.Query(r.Context(),
		`SELECT u.id, u.name, u.picture
		 FROM group_members gm JOIN users u ON gm.user_id = u.id
		 WHERE gm.group_id=$1`,
		groupID,
	)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	members := []UserTimeline{}
	memberIDs := []string{}

	// members is an array of UserTimeline with empty timelines
	for rows.Next() {
		var u UserTimeline
		if err := rows.Scan(&u.UserID, &u.Name, &u.Avatar); err != nil {
			continue
		}
		u.Timeline = make([]PhotoSlot, 24)
		members = append(members, u)
		memberIDs = append(memberIDs, u.UserID)
	}

	startOfDay := time.Now().UTC().Truncate(24 * time.Hour)
	endOfDay := startOfDay.Add(24 * time.Hour)

	// get all rows where user_id in memberIDs and hour_timestamp is today
	photoRows, err := db.Query(r.Context(),
		`SELECT user_id, hour_timestamp, s3_key, bucket
		 FROM photos
		 WHERE user_id = ANY($1)
		 AND hour_timestamp >= $2 AND hour_timestamp < $3`,
		memberIDs, startOfDay, endOfDay,
	)
	if err != nil {
		http.Error(w, "Database error fetching photos", http.StatusInternalServerError)
		return
	}
	defer photoRows.Close()

	// map of userID -> hour -> publicURL
	photoMap := make(map[string]map[int]string)
	s3Endpoint := os.Getenv("S3_ENDPOINT")

	for photoRows.Next() {
		var uid string
		var ts time.Time
		var key, bucket string
		if err := photoRows.Scan(&uid, &ts, &key, &bucket); err != nil {
			continue
		}

		hour := ts.Hour()

		var publicURL string
		if strings.Contains(s3Endpoint, "localhost") {
			publicURL = fmt.Sprintf("%s/%s/%s", s3Endpoint, bucket, key)
		} else {
			publicURL = fmt.Sprintf("https://%s.s3.amazonaws.com/%s", bucket, key)
		}

		if photoMap[uid] == nil {
			photoMap[uid] = make(map[int]string)
		}
		photoMap[uid][hour] = publicURL
	}

	// for each member, fill in their timeline
	for i, member := range members {
		for h := 0; h < 24; h++ {
			if url, found := photoMap[member.UserID][h]; found {
				members[i].Timeline[h] = PhotoSlot{
					Hour:   h,
					Status: "taken",
					URL:    &url,
				}
			} else {
				members[i].Timeline[h] = PhotoSlot{
					Hour:   h,
					Status: "missed",
					URL:    nil,
				}
			}
		}
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"date":    startOfDay.Format("2006-01-02"),
		"members": members,
	})
}
