export interface Group {
    id: string;
    owner_id: string;
    name: string;
}

export interface PendingRequest {
    id: string;
    email: string;
    name: string;
    picture: string;
}