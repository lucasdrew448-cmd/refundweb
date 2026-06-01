-- ========================================
-- Refund Request Portal - SQL Schema
-- ========================================
-- 
-- SECURITY NOTE: This schema stores credit card data.
-- In production, NEVER store full credit card numbers in plain text.
-- Use a payment processor (Stripe, Square, PayPal) to tokenize cards
-- and store only the token, not the actual card number.
--

-- Create refunds table
CREATE TABLE refunds (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Request Tracking
    requestId VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'processing', 'completed', 'denied')),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    submittedAt DATETIME,
    
    -- Personal Information
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    accountId VARCHAR(100),
    
    -- Refund Details
    refundType VARCHAR(100) NOT NULL,
    refundAmount DECIMAL(10, 2) NOT NULL,
    reason LONGTEXT NOT NULL,
    actionsTaken LONGTEXT,
    
    -- Credit Card Information (STORE SECURELY - Use tokenization in production)
    cardholderName VARCHAR(255) NOT NULL,
    cardNumber VARCHAR(19),  -- NEVER STORE REAL CARD DATA - Use token only in production
    cardExpiry VARCHAR(5),   -- MM/YY format
    cardCVV VARCHAR(4),      -- NEVER STORE IN PRODUCTION - Use token only
    
    -- Billing Address
    billingStreet VARCHAR(255) NOT NULL,
    billingCity VARCHAR(100) NOT NULL,
    billingState VARCHAR(100) NOT NULL,
    billingZip VARCHAR(20) NOT NULL,
    billingCountry VARCHAR(100) NOT NULL,
    
    -- Refund Processing
    refundMethod VARCHAR(50) DEFAULT 'credit_card',
    
    -- Verification & Consent
    cardDataConfirm BOOLEAN DEFAULT FALSE,
    accuracy BOOLEAN DEFAULT FALSE,
    authorization BOOLEAN DEFAULT FALSE,
    privacyRefund BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    userAgent TEXT,
    ipAddress VARCHAR(45),
    notes LONGTEXT,
    
    -- Indexes for common queries
    INDEX idx_email (email),
    INDEX idx_requestId (requestId),
    INDEX idx_status (status),
    INDEX idx_createdAt (createdAt),
    INDEX idx_accountId (accountId)
);

-- Create refund_tracking table for status history
CREATE TABLE refund_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    refundId INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    statusMessage TEXT,
    expectedResolution DATE,
    changedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (refundId) REFERENCES refunds(id) ON DELETE CASCADE,
    INDEX idx_refundId (refundId),
    INDEX idx_changedAt (changedAt)
);

-- Sample queries for common operations:

-- 1. Insert a new refund request
-- INSERT INTO refunds (
--     requestId, fullName, email, phone, accountId, refundType, refundAmount,
--     reason, actionsTaken, cardholderName, cardNumber, cardExpiry, cardCVV,
--     billingStreet, billingCity, billingState, billingZip, billingCountry,
--     refundMethod, cardDataConfirm, accuracy, authorization, privacyRefund,
--     userAgent, ipAddress, submittedAt
-- ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- 2. Get refund by requestId and email
-- SELECT * FROM refunds WHERE requestId = ? AND email = ?;

-- 3. Update refund status
-- UPDATE refunds SET status = ?, updatedAt = NOW() WHERE id = ?;

-- 4. Get all pending reviews
-- SELECT * FROM refunds WHERE status = 'pending_review' ORDER BY createdAt ASC;

-- 5. Get recent refunds (last 30 days)
-- SELECT * FROM refunds WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY createdAt DESC;

-- 6. Add tracking history
-- INSERT INTO refund_tracking (refundId, status, statusMessage, expectedResolution)
-- VALUES (?, ?, ?, ?);

-- 7. Get tracking history for a refund
-- SELECT * FROM refund_tracking WHERE refundId = ? ORDER BY changedAt DESC;
