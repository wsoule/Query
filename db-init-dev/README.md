# Development Database Initialization Scripts

This directory contains SQL scripts for the **development** database that run automatically on container startup.

## Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: querydb_dev
- **Username**: queryuser
- **Password**: querypass

**Connection String:**
```
postgresql://queryuser:querypass@localhost:5432/querydb_dev
```

## Tables Created

### 1. users (1,000 rows)
Small dataset for testing user-related queries.
- Columns: id, username, email, full_name, created_at, is_active
- Primary key: id
- Unique constraints: username, email

### 2. products (500 rows)
Medium dataset with product catalog.
- Columns: id, name, description, price, stock_quantity, category, created_at, updated_at
- Primary key: id
- Categories: Electronics, Clothing, Books, Home & Garden, Sports

### 3. orders (5,000 rows)
Medium dataset with order transactions.
- Columns: id, user_id, product_id, quantity, total_price, status, order_date
- Primary key: id
- Foreign keys: user_id ’ users(id), product_id ’ products(id)
- Statuses: completed, pending, shipped, cancelled

### 4. events (1,000,000 rows)
**Large dataset for testing performance with analytics/tracking data.**
- Columns: id, event_type, user_id, session_id, ip_address, user_agent, page_url, referrer, event_data, created_at
- Primary key: id
- Event types: page_view, click, form_submit, purchase, signup, logout
- Includes JSONB data for complex queries
- Has indexes on: event_type, user_id, created_at, session_id

## Key Differences from Production

The dev database is **simpler** than production:
- **No audit columns** (created_by, updated_by) on most tables
- **No soft deletes** (deleted_at) on users
- **Fewer rows** in users, products, and orders
- **Missing tables**: sessions, audit_logs (prod only)
- **Missing columns**: SKU on products, shipping fields on orders, login tracking on users

See [DATABASE.md](../DATABASE.md) for complete comparison.

## Quick Access

```bash
# Connect via psql
./db-start.sh psql-dev

# View logs
./db-start.sh logs-dev
```

## Example Queries

Test the large events table:
```sql
-- Count events by type
SELECT event_type, COUNT(*) as count
FROM events
GROUP BY event_type
ORDER BY count DESC;

-- Recent page views
SELECT * FROM events
WHERE event_type = 'page_view'
ORDER BY created_at DESC
LIMIT 100;

-- User activity analysis
SELECT user_id, COUNT(*) as event_count,
       MIN(created_at) as first_event,
       MAX(created_at) as last_event
FROM events
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY event_count DESC
LIMIT 10;
```

Test joins:
```sql
-- Orders with user and product details
SELECT o.id, u.username, p.name, o.quantity, o.total_price, o.status
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN products p ON o.product_id = p.id
LIMIT 100;
```
