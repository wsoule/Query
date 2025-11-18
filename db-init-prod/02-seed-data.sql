-- Production Database Seed Data
-- Differences from dev:
-- - More users (1,500 vs 1,000), some soft-deleted
-- - More products (750 vs 500), with SKUs and publish status
-- - More orders (7,500 vs 5,000), with shipping tracking
-- - Sessions table populated
-- - Audit logs generated

-- Insert 1500 users with production-specific fields
INSERT INTO users (username, email, full_name, is_active, deleted_at, last_login_at, login_count)
SELECT
    'user_' || i,
    'user_' || i || '@example.com',
    'User ' || i || ' Name',
    CASE WHEN random() < 0.85 THEN true ELSE false END,
    CASE WHEN random() < 0.05 THEN CURRENT_TIMESTAMP - (random() * interval '180 days') ELSE NULL END,  -- 5% soft deleted
    CASE WHEN random() < 0.7 THEN CURRENT_TIMESTAMP - (random() * interval '30 days') ELSE NULL END,
    FLOOR(random() * 100)::integer
FROM generate_series(1, 1500) AS i;

-- Insert 750 products with SKUs and publish status
INSERT INTO products (name, description, price, stock_quantity, category, sku, created_by, updated_by, is_published)
SELECT
    'Product ' || i,
    'Description for product ' || i || '. This is a high-quality item with excellent features.',
    ROUND((random() * 999 + 1)::numeric, 2),
    FLOOR(random() * 1000)::integer,
    CASE
        WHEN i % 5 = 0 THEN 'Electronics'
        WHEN i % 5 = 1 THEN 'Clothing'
        WHEN i % 5 = 2 THEN 'Books'
        WHEN i % 5 = 3 THEN 'Home & Garden'
        ELSE 'Sports'
    END,
    'SKU-' || LPAD(i::text, 8, '0'),
    'admin',
    CASE WHEN random() < 0.3 THEN 'editor' ELSE 'admin' END,
    CASE WHEN random() < 0.8 THEN true ELSE false END  -- 80% published
FROM generate_series(1, 750) AS i;

-- Insert 7500 orders with shipping information
INSERT INTO orders (user_id, product_id, quantity, total_price, status, order_date, shipped_at, delivered_at, tracking_number, created_by, updated_by)
SELECT
    FLOOR(random() * 1500 + 1)::integer,
    FLOOR(random() * 750 + 1)::integer,
    FLOOR(random() * 10 + 1)::integer,
    ROUND((random() * 999 + 1)::numeric, 2),
    CASE
        WHEN random() < 0.5 THEN 'completed'
        WHEN random() < 0.7 THEN 'pending'
        WHEN random() < 0.85 THEN 'shipped'
        WHEN random() < 0.95 THEN 'delivered'
        ELSE 'cancelled'
    END,
    CURRENT_TIMESTAMP - (random() * interval '365 days'),
    CASE WHEN random() < 0.6 THEN CURRENT_TIMESTAMP - (random() * interval '300 days') ELSE NULL END,
    CASE WHEN random() < 0.5 THEN CURRENT_TIMESTAMP - (random() * interval '290 days') ELSE NULL END,
    CASE WHEN random() < 0.7 THEN 'TRK' || FLOOR(random() * 999999999)::text ELSE NULL END,
    'system',
    CASE WHEN random() < 0.2 THEN 'admin' ELSE 'system' END
FROM generate_series(1, 7500) AS i;

-- Insert 1 MILLION events (same as dev)
DO $$
DECLARE
    batch_size INTEGER := 100000;
    total_rows INTEGER := 1000000;
    batches INTEGER := total_rows / batch_size;
    batch_num INTEGER;
BEGIN
    FOR batch_num IN 0..(batches - 1) LOOP
        INSERT INTO events (event_type, user_id, session_id, ip_address, user_agent, page_url, referrer, event_data, created_at)
        SELECT
            CASE
                WHEN random() < 0.3 THEN 'page_view'
                WHEN random() < 0.5 THEN 'click'
                WHEN random() < 0.7 THEN 'form_submit'
                WHEN random() < 0.85 THEN 'purchase'
                WHEN random() < 0.95 THEN 'signup'
                ELSE 'logout'
            END,
            CASE WHEN random() < 0.7 THEN FLOOR(random() * 1500 + 1)::integer ELSE NULL END,
            gen_random_uuid(),
            ('192.168.' || FLOOR(random() * 255)::text || '.' || FLOOR(random() * 255)::text)::inet,
            CASE
                WHEN random() < 0.5 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
                WHEN random() < 0.7 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36'
                WHEN random() < 0.9 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1'
                ELSE 'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0'
            END,
            '/page/' || FLOOR(random() * 100)::text,
            CASE
                WHEN random() < 0.3 THEN NULL
                WHEN random() < 0.6 THEN 'https://google.com'
                WHEN random() < 0.8 THEN 'https://facebook.com'
                ELSE 'https://twitter.com'
            END,
            jsonb_build_object(
                'duration', FLOOR(random() * 300)::integer,
                'scroll_depth', FLOOR(random() * 100)::integer,
                'clicks', FLOOR(random() * 50)::integer
            ),
            CURRENT_TIMESTAMP - (random() * interval '365 days')
        FROM generate_series(1, batch_size) AS i;

        RAISE NOTICE 'Inserted batch % of % (% rows total)', batch_num + 1, batches, (batch_num + 1) * batch_size;
    END LOOP;
END $$;

-- Insert 5000 sessions (PROD ONLY)
INSERT INTO sessions (user_id, token, ip_address, user_agent, created_at, expires_at, last_activity_at)
SELECT
    FLOOR(random() * 1500 + 1)::integer,
    'tok_' || md5(random()::text || i::text),
    ('192.168.' || FLOOR(random() * 255)::text || '.' || FLOOR(random() * 255)::text)::inet,
    CASE
        WHEN random() < 0.5 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
        WHEN random() < 0.7 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36'
        ELSE 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1'
    END,
    CURRENT_TIMESTAMP - (random() * interval '30 days'),
    CURRENT_TIMESTAMP + (random() * interval '7 days'),
    CURRENT_TIMESTAMP - (random() * interval '1 day')
FROM generate_series(1, 5000) AS i;

-- Insert 10000 audit log entries (PROD ONLY)
INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at, ip_address)
SELECT
    CASE
        WHEN random() < 0.4 THEN 'users'
        WHEN random() < 0.6 THEN 'products'
        WHEN random() < 0.8 THEN 'orders'
        ELSE 'sessions'
    END,
    FLOOR(random() * 1000 + 1)::integer,
    CASE
        WHEN random() < 0.1 THEN 'INSERT'
        WHEN random() < 0.8 THEN 'UPDATE'
        ELSE 'DELETE'
    END,
    jsonb_build_object(
        'status', 'old_value',
        'updated_at', (CURRENT_TIMESTAMP - (random() * interval '30 days'))::text
    ),
    jsonb_build_object(
        'status', 'new_value',
        'updated_at', CURRENT_TIMESTAMP::text
    ),
    CASE
        WHEN random() < 0.5 THEN 'admin'
        WHEN random() < 0.8 THEN 'system'
        ELSE 'editor'
    END,
    CURRENT_TIMESTAMP - (random() * interval '90 days'),
    ('10.0.' || FLOOR(random() * 255)::text || '.' || FLOOR(random() * 255)::text)::inet
FROM generate_series(1, 10000) AS i;

-- Update statistics for better query planning
ANALYZE users;
ANALYZE products;
ANALYZE orders;
ANALYZE events;
ANALYZE sessions;
ANALYZE audit_logs;
