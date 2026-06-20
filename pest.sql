
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)        NOT NULL,
    phone       VARCHAR(15)         UNIQUE NOT NULL,  
    email       VARCHAR(255)        UNIQUE,           
    language    VARCHAR(20)         DEFAULT 'english',
    created_at  TIMESTAMP           DEFAULT NOW()
);


CREATE TABLE scan_results (
    id                  SERIAL PRIMARY KEY,
    user_id             VARCHAR(15)     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pest_name           VARCHAR(100)    NOT NULL,
    confidence_pct      FLOAT           NOT NULL,
    description         TEXT,
    prevention_method   TEXT,
    pesticides          TEXT[],         
    image_base64        TEXT,           
    language            VARCHAR(20)     DEFAULT 'english',
    scanned_at          TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX idx_scan_user ON scan_results(user_phone);
CREATE INDEX idx_scan_time ON scan_results(scanned_at DESC);




SELECT * FROM users;

SELECT u.name, s.pest_name, s.confidence_pct, s.scanned_at
FROM scan_results s
JOIN users u ON s.user_id = u.id
ORDER BY s.scanned_at DESC;

