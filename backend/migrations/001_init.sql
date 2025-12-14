CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    google_sub TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture TEXT,
    timezone TEXT DEFAULT 'UTC',
    role TEXT DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS friendships (
    user_a_id UUID REFERENCES users(id),
    user_b_id UUID REFERENCES users(id),
    status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')),
    PRIMARY KEY (user_a_id, user_b_id),
    CONSTRAINT ensure_canonical_order CHECK (user_a_id < user_b_id)
);

CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY,
    owner_id UUID REFERENCES users(id),
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID REFERENCES groups(id),
    user_id UUID REFERENCES users(id),
    PRIMARY KEY (group_id, user_id)
);