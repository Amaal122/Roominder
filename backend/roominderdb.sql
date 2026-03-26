

CREATE TABLE users (
    id               SERIAL PRIMARY KEY,
    email            VARCHAR UNIQUE NOT NULL,
    hashed_password  VARCHAR NOT NULL,
    full_name        VARCHAR,
    role             VARCHAR CHECK (role IN ('owner', 'housing', 'both')),
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users (email, hashed_password, full_name, role, is_active, created_at) VALUES

(
    'bob@example.com',
    '$2b$12$LJY0yWIvCirPKDtROxu6/.Uz2jNrMlGtC8K2C3d4E5f6G7h8I9j0K',
    'Bob Smith',
    'seeker',
    TRUE,
    '2024-02-10 10:30:00'
),
(
    'carol@example.com',
    '$2b$12$MKZ1zXJwDjsQLEuSPyv7/.Vz3kOsMmHuD9L3D4e5F6g7H8i9J0k1L',
    'Carol White',
    'both',
    TRUE,
    '2024-03-05 14:00:00'
),
(
    'david@example.com',
    '$2b$12$NLA2aYKxEktRMFvTQzw8/.Wz4lPtNnIvE0M4E5f6G7h8I9j0K1l2M',
    'David Brown',
    'owner',
    FALSE,
    '2024-03-20 08:45:00'
),
(
    'eva@example.com',
    '$2b$12$OMB3bZLyFlsUN GwURax9/.Xz5mQuOoJwF1N5F6g7H8i9J0k1L2m3N',
    'Eva Green',
    'seeker',
    TRUE,
    '2024-04-01 16:20:00'
);
DROP TABLE IF EXISTS students CASCADE;
CREATE TABLE houses (
    id SERIAL PRIMARY KEY,
    owner_id INT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    location TEXT,
    price INT,
    rooms INT,
    bathrooms INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);