-- =============================================
-- 1. AUTHENTICATION & USERS
-- =============================================
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER','STAFF');

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'STAFF',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 2. MASTER DATA (CONFIGURATION)
-- =============================================

-- 2.1 Room Types 
CREATE TABLE room_types (
    room_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
    max_guests INT NOT NULL DEFAULT 3,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2.2 Customer Types (Domestic/Foreign rules)
CREATE TABLE customer_types (
    customer_type_id VARCHAR(10) PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL,
    surcharge_coefficient DECIMAL(4, 2) NOT NULL CHECK (surcharge_coefficient >= 1.0) DEFAULT 1.0 
);

CREATE TABLE surcharge_rules (
    rule_id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    ratio DECIMAL(4, 2) NOT NULL DEFAULT 0.25,
    extra_guest_threshold INT NOT NULL DEFAULT 3,
    description TEXT
);

-- =============================================
-- 3. OPERATIONAL DATA (ENTITIES)
-- =============================================

-- 3.1 Rooms
CREATE TYPE room_status AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');

CREATE TABLE rooms (
    room_id VARCHAR(10) PRIMARY KEY,
    room_name VARCHAR(100) NOT NULL,
    room_type_id INT REFERENCES room_types(room_type_id),
    status room_status DEFAULT 'AVAILABLE',
    note TEXT
);

-- 3.2 Customers
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    identity_card VARCHAR(20) UNIQUE NOT NULL, -- CMND/CCCD/Passport
    address VARCHAR(255),
    phone_number VARCHAR(15),
    customer_type_id VARCHAR(10) REFERENCES customer_types(customer_type_id)
);

-- =============================================
-- 4. AUDIT LOGS (HISTORICAL RECORDS)
-- =============================================

-- 4.1 Tracks price and max guest changes over time 
CREATE TABLE room_type_history (
    history_id SERIAL PRIMARY KEY,
    room_type_id INT REFERENCES room_types(room_type_id),
    changed_by INT REFERENCES users(user_id), 
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2),
    old_max_guests INT,
    new_max_guests INT,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- 4.2 Tracks surcharge coefficient changes over time
CREATE TABLE customer_type_history (
    history_id SERIAL PRIMARY KEY,
    customer_type_id VARCHAR(10) REFERENCES customer_types(customer_type_id),
    changed_by INT REFERENCES users(user_id),
    old_coefficient DECIMAL(4, 2),
    new_coefficient DECIMAL(4, 2),
    changed_at TIMESTAMP DEFAULT NOW()
);

-- 4.3 Tracks surcharge rule changes over time
CREATE TABLE surcharge_rule_history (
    history_id SERIAL PRIMARY KEY,
    rule_id INT REFERENCES surcharge_rules(rule_id),
    changed_by INT REFERENCES users(user_id),
    old_ratio DECIMAL(4, 2),
    new_ratio DECIMAL(4, 2),
    old_threshold INT,
    new_threshold INT,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 5. TRANSACTIONS (SNAPSHOT LOGIC)
-- =============================================

-- 5.1 Rental Slips (The Booking)
CREATE TYPE rental_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TABLE rental_slips (
    rental_slip_id SERIAL PRIMARY KEY,
    room_id VARCHAR(10) REFERENCES rooms(room_id),
    created_by INT REFERENCES users(user_id),
    started_at TIMESTAMP DEFAULT NOW(),
    status rental_status DEFAULT 'ACTIVE',

    -- SNAPSHOT FIELDS 
    snap_price DECIMAL(10, 2) NOT NULL,           
    snap_max_guests INT NOT NULL,           
    -- Get max surcharge coefficient from customer type    
    snap_surcharge_coefficient DECIMAL(4, 2) NOT NULL, 
    snap_extra_guest_threshold INT NOT NULL, 
    snap_surcharge_ratio DECIMAL(4, 2) NOT NULL
);

-- 5.2 Rental Details (Guests in the room)
CREATE TABLE rental_details (
    rental_slip_id INT REFERENCES rental_slips(rental_slip_id) ON DELETE CASCADE,
    customer_id INT REFERENCES customers(customer_id),
    PRIMARY KEY (rental_slip_id, customer_id)
);

-- 5.3 Invoices (Billing)
CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    rental_slip_id INT UNIQUE REFERENCES rental_slips(rental_slip_id),
    created_by INT REFERENCES users(user_id),
    payer_name VARCHAR(100) NOT NULL,
    payment_method VARCHAR(50);
    payment_date TIMESTAMP DEFAULT NOW(),
    total_days INT CHECK (total_days > 0),
    total_amount DECIMAL(15, 2) NOT NULL,
    note TEXT
);

-- =============================================
-- 6. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_rentals_room ON rental_slips(room_id);
CREATE INDEX idx_rentals_status ON rental_slips(status);
CREATE INDEX idx_customers_identity ON customers(identity_card);
CREATE INDEX idx_rentaldetails_customer ON rental_details(customer_id);