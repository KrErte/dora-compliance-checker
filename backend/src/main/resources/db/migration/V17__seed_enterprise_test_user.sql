-- Seed enterprise test user for testing all features
-- Email: enterprise@doraaudit.eu / Password: Enterprise123!
-- This user has ENTERPRISE subscription with 10-year validity

INSERT INTO users (id, email, password, full_name, role, account_tier, auth_provider, created_at, early_adopter, trial_end_date)
VALUES (
    'e0000000-0000-0000-0000-enterprise01',
    'enterprise@doraaudit.eu',
    '$2b$12$e8qgIMFWk8L1ywdPSSSeiepNuSrPd4BsXXV4vAVhgmBmxxKXy5HOm',
    'Enterprise Test',
    'USER',
    'PREMIUM',
    'LOCAL',
    CURRENT_TIMESTAMP,
    false,
    CURRENT_DATE + INTERVAL '10 years'
);

INSERT INTO user_subscriptions (id, user_id, plan, status, valid_until, created_at, updated_at)
VALUES (
    's0000000-0000-0000-0000-enterprise01',
    'e0000000-0000-0000-0000-enterprise01',
    'ENTERPRISE',
    'ACTIVE',
    CURRENT_TIMESTAMP + INTERVAL '10 years',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
