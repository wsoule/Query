-- Seed data for all tables

-- Insert 1000 users
INSERT INTO users (username, email, full_name, is_active)
SELECT
    'user_' || i,
    'user_' || i || '@example.com',
    'User ' || i || ' Name',
    CASE WHEN random() < 0.9 THEN true ELSE false END
FROM generate_series(1, 1000) AS i;

-- Insert 500 products across different categories
INSERT INTO products (name, description, price, stock_quantity, category)
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
    END
FROM generate_series(1, 500) AS i;

-- Insert 5000 orders
INSERT INTO orders (user_id, product_id, quantity, total_price, status, order_date)
SELECT
    FLOOR(random() * 1000 + 1)::integer,
    FLOOR(random() * 500 + 1)::integer,
    FLOOR(random() * 10 + 1)::integer,
    ROUND((random() * 999 + 1)::numeric, 2),
    CASE
        WHEN random() < 0.6 THEN 'completed'
        WHEN random() < 0.8 THEN 'pending'
        WHEN random() < 0.95 THEN 'shipped'
        ELSE 'cancelled'
    END,
    CURRENT_TIMESTAMP - (random() * interval '365 days')
FROM generate_series(1, 5000) AS i;

-- Insert 1 MILLION events (analytics/tracking data)
-- This is done in batches to avoid memory issues
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
            CASE WHEN random() < 0.7 THEN FLOOR(random() * 1000 + 1)::integer ELSE NULL END,
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

-- Update statistics for better query planning
ANALYZE users;
ANALYZE products;
ANALYZE orders;
ANALYZE events;
