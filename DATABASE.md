# Database Setup for Query

This project includes two PostgreSQL databases that simulate development and production environments with intentional schema differences for testing database comparison features.

## Quick Start

```bash
# Start both databases
docker-compose up -d

# Watch initialization progress (takes 1-2 minutes for 1M rows per database)
docker-compose logs -f

# Or use the convenience script
./db-start.sh start
```

## Database Overview

### Development Database (Port 5432)
**Connection String:**
```
postgresql://queryuser:querypass@localhost:5432/querydb_dev
```

**Tables:**
- `users` (1,000 rows) - Basic user accounts
- `products` (500 rows) - Product catalog
- `orders` (5,000 rows) - Order transactions
- `events` (1,000,000 rows) - Analytics events

### Production Database (Port 5433)
**Connection String:**
```
postgresql://queryuser:querypass@localhost:5433/querydb_prod
```

**Tables:**
- `users` (1,500 rows) - User accounts with audit fields
- `products` (750 rows) - Products with SKUs
- `orders` (7,500 rows) - Orders with shipping tracking
- `events` (1,000,000 rows) - Analytics events
- `sessions` (5,000 rows) - **PROD ONLY** - Session management
- `audit_logs` (10,000 rows) - **PROD ONLY** - Audit trail

## Schema Differences (Dev vs Prod)

These differences simulate a realistic scenario where production has evolved beyond development:

### users Table
| Column | Dev | Prod | Notes |
|--------|-----|------|-------|
| `deleted_at` | ❌ | ✅ | Soft deletes (prod only) |
| `last_login_at` | ❌ | ✅ | Track login activity |
| `login_count` | ❌ | ✅ | Login statistics |

### products Table
| Column | Dev | Prod | Notes |
|--------|-----|------|-------|
| `sku` | ❌ | ✅ | Stock Keeping Unit |
| `created_by` | ❌ | ✅ | Audit trail |
| `updated_by` | ❌ | ✅ | Audit trail |
| `is_published` | ❌ | ✅ | Publication status |

### orders Table
| Column | Dev | Prod | Notes |
|--------|-----|------|-------|
| `shipped_at` | ❌ | ✅ | Shipping timestamp |
| `delivered_at` | ❌ | ✅ | Delivery timestamp |
| `tracking_number` | ❌ | ✅ | Shipment tracking |
| `created_by` | ❌ | ✅ | Audit trail |
| `updated_by` | ❌ | ✅ | Audit trail |
| `updated_at` | ❌ | ✅ | Last update time |

### Additional Prod-Only Tables
- **`sessions`** - User session management with tokens and expiration
- **`audit_logs`** - Comprehensive audit trail for compliance

### Index Differences
Production has additional indexes for:
- Partial indexes on `orders` (status-specific)
- Soft delete filtering on `users`
- SKU lookups on `products`
- Session token lookups

## Data Volume Differences

| Table | Dev Rows | Prod Rows | Difference |
|-------|----------|-----------|------------|
| users | 1,000 | 1,500 | +50% |
| products | 500 | 750 | +50% |
| orders | 5,000 | 7,500 | +50% |
| events | 1,000,000 | 1,000,000 | Same |
| sessions | - | 5,000 | Prod only |
| audit_logs | - | 10,000 | Prod only |

## Common Operations

### Connect to Specific Database

**Development:**
```bash
docker exec -it query-postgres-dev psql -U queryuser -d querydb_dev
```

**Production:**
```bash
docker exec -it query-postgres-prod psql -U queryuser -d querydb_prod
```

### Compare Schemas

```sql
-- List all tables in each database
\dt

-- Describe a specific table
\d users
\d products
\d orders

-- Compare column counts
SELECT table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
```

### Test Queries

**Development Database:**
```sql
-- Simple user query
SELECT * FROM users WHERE is_active = true LIMIT 10;

-- Products by category
SELECT category, COUNT(*) FROM products GROUP BY category;
```

**Production Database:**
```sql
-- Active users (excluding soft deletes)
SELECT * FROM users WHERE deleted_at IS NULL AND is_active = true LIMIT 10;

-- Published products with SKUs
SELECT sku, name, price FROM products WHERE is_published = true LIMIT 10;

-- Shipped orders with tracking
SELECT id, tracking_number, shipped_at, delivered_at
FROM orders
WHERE tracking_number IS NOT NULL
LIMIT 10;

-- Recent audit activity
SELECT table_name, action, changed_by, changed_at
FROM audit_logs
ORDER BY changed_at DESC
LIMIT 20;

-- Active sessions
SELECT s.token, u.username, s.last_activity_at
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires_at > CURRENT_TIMESTAMP
LIMIT 10;
```

## Management Scripts

### db-start.sh Commands
```bash
./db-start.sh start     # Start both databases
./db-start.sh stop      # Stop both databases
./db-start.sh restart   # Restart both databases
./db-start.sh reset     # Wipe all data and reinitialize
./db-start.sh logs      # View logs
./db-start.sh status    # Show container status
```

### Connect via psql
```bash
# Development
./db-start.sh psql-dev

# Production
./db-start.sh psql-prod
```

## Use Cases

### Testing Schema Comparison
Connect to both databases in the Query app and compare:
- Column differences between same tables
- Tables that exist in prod but not dev
- Index differences
- Constraint differences

### Testing Performance
The `events` table with 1 million rows is perfect for:
- Query optimization testing
- Index performance comparison
- Large result set handling
- Pagination testing

### Testing Multi-Database Workflows
- Switch between dev and prod connections
- Compare query results
- Test migration scripts
- Validate data consistency

## Resetting Databases

To start fresh with clean data:
```bash
# Stop and remove all data
docker-compose down -v

# Start fresh
docker-compose up -d

# Wait for initialization
docker-compose logs -f
```

## Troubleshooting

**Port conflicts:**
- Dev uses 5432 (standard PostgreSQL port)
- Prod uses 5433 (non-standard to avoid conflicts)

**Initialization taking too long:**
- Each database inserts 1M events in batches
- Expected time: 1-2 minutes per database
- Monitor progress: `docker-compose logs -f`

**Connection refused:**
- Wait for healthcheck to pass: `docker-compose ps`
- Check logs: `docker-compose logs postgres-dev` or `postgres-prod`
