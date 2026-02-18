-- Seed enterprise test user for testing all features
-- Email: enterprise@test.local / Password: Enterprise123!
-- This user has ENTERPRISE subscription with 10-year validity

INSERT INTO users (id, email, password, full_name, role, account_tier, auth_provider, created_at, early_adopter, trial_end_date)
VALUES (
    'e0000000-0000-0000-0000-enterprise01',
    'enterprise@test.local',
    '$2b$12$e8qgIMFWk8L1ywdPSSSeiepNuSrPd4BsXXV4vAVhgmBmxxKXy5HOm',
    'Enterprise Test',
    'USER',
    'PREMIUM',
    'LOCAL',
    CURRENT_TIMESTAMP,
    false,
    DATEADD('YEAR', 10, CURRENT_DATE)
);

INSERT INTO user_subscriptions (id, user_id, plan, status, valid_until, created_at, updated_at)
VALUES (
    's0000000-0000-0000-0000-enterprise01',
    'e0000000-0000-0000-0000-enterprise01',
    'ENTERPRISE',
    'ACTIVE',
    DATEADD('YEAR', 10, CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
