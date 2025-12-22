// GROUPS
export interface Group {
  id: string;
  owner_id: string;
  name: string;
}

// FRIENDS
export interface Friend {
  id: string;
  name: string;
  picture: string;
}

export interface PendingRequest {
  id: string;
  email: string;
  name: string;
  picture: string;
}

// MEDIA UPLOADS
export interface UploadConfig {
  upload_url: string;
  key: string;
  slot_timestamp: string;
}