-- Create tables with various schemas

-- Users table (small dataset)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Products table (medium dataset)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table (medium dataset)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table (LARGE - 1 million rows)
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

-- Create indexes for better query performance
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_category ON products(category);
