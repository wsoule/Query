-- Production Database Schema
-- Notable differences from dev:
-- 1. Audit columns (created_by, updated_by, updated_at) on most tables
-- 2. Soft deletes (deleted_at) on users
-- 3. Additional tables: audit_logs, sessions
-- 4. Additional indexes for production performance
-- 5. Stricter constraints

-- Users table (with soft deletes and audit columns)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,  -- Soft delete (PROD ONLY)
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,  -- PROD ONLY
    login_count INTEGER DEFAULT 0  -- PROD ONLY
);

-- Products table (with audit columns)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    category VARCHAR(50),
    sku VARCHAR(100) UNIQUE,  -- PROD ONLY - Stock Keeping Unit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),  -- PROD ONLY
    updated_by VARCHAR(50),  -- PROD ONLY
    is_published BOOLEAN DEFAULT false  -- PROD ONLY
);

-- Orders table (with audit columns and additional status)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP,  -- PROD ONLY
    delivered_at TIMESTAMP,  -- PROD ONLY
    tracking_number VARCHAR(100),  -- PROD ONLY
    created_by VARCHAR(50),  -- PROD ONLY
    updated_by VARCHAR(50),  -- PROD ONLY
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- PROD ONLY
);

-- Events table (same structure but with retention policy hint)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INTEGER,
    session_id UUID NOT NULL,
    ip_address INET,
    user_agent TEXT,
    page_url VARCHAR(500),
    referrer VARCHAR(500),
    event_data JSONB,
    created_at TIMESTAMP NOT NULL
);

-- Sessions table (PROD ONLY - for session management)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table (PROD ONLY - compliance/tracking)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL,  -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(50),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
);

-- Create comprehensive indexes for production performance
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_last_login ON users(last_login_at);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_published ON products(is_published);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_shipped_at ON orders(shipped_at) WHERE shipped_at IS NOT NULL;

CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_session_id ON events(session_id);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX idx_audit_logs_changed_by ON audit_logs(changed_by);

-- Production-specific: Partial indexes for better performance
CREATE INDEX idx_orders_pending ON orders(id) WHERE status = 'pending';
CREATE INDEX idx_orders_shipped ON orders(id) WHERE status = 'shipped';
