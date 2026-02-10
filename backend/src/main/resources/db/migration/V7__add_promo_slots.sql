-- Create promo_slots table for configurable promo slot counters
CREATE TABLE promo_slots (
    id VARCHAR(50) PRIMARY KEY,
    taken INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default early adopter promo
INSERT INTO promo_slots (id, taken, total) VALUES ('early_adopter', 5, 10);
