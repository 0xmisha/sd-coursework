CREATE TABLE IF NOT EXISTS owners (
    id SERIAL PRIMARY KEY,
    owner_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(200) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    owner_name VARCHAR(100) NOT NULL,
    CONSTRAINT fk_events_owners
        FOREIGN KEY (owner_name)
        REFERENCES owners(owner_name)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_owner_name ON events(owner_name);
CREATE INDEX IF NOT EXISTS idx_owners_name ON owners(owner_name);

INSERT INTO owners (owner_name) VALUES
    ('Иван Петров'),
    ('Мария Сидорова'),
    ('Алексей Козлов')
ON CONFLICT (owner_name) DO NOTHING;

INSERT INTO events (event_name, owner_name) VALUES
    ('Встреча с клиентом', 'Иван Петров'),
    ('Презентация проекта', 'Мария Сидорова')
ON CONFLICT DO NOTHING;
