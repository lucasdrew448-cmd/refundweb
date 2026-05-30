<!-- Example Backend API Configuration -->
<!-- This file shows example backend implementations -->

# Backend API Examples

This document provides example implementations for receiving fraud reports from the frontend.

## Quick Start Backend

### Minimal Node.js/Express Server

**server.js:**
```javascript
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:8000', 'http://localhost:8080', 'https://your-domain.com'],
    methods: ['POST', 'GET'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data storage (in production, use database)
const reportsFile = 'fraud_reports.json';

// Helper functions
function getReports() {
    try {
        if (fs.existsSync(reportsFile)) {
            return JSON.parse(fs.readFileSync(reportsFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading reports:', error);
    }
    return [];
}

function saveReport(report) {
    const reports = getReports();
    reports.push(report);
    fs.writeFileSync(reportsFile, JSON.stringify(reports, null, 2), 'utf8');
}

function generateReferenceId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `FRD-2026-${String(random).padStart(8, '0')}`;
}

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Fraud report submission
app.post('/api/fraud-reports', (req, res) => {
    try {
        const fraudReport = req.body;

        // Validate required fields
        const requiredFields = ['fullName', 'email', 'fraudType', 'description'];
        const errors = {};

        for (const field of requiredFields) {
            if (!fraudReport[field]) {
                errors[field] = `${field} is required`;
            }
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(fraudReport.email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Generate reference ID and timestamp
        const referenceId = generateReferenceId();
        const timestamp = new Date().toISOString();

        // Create report object
        const reportToSave = {
            referenceId,
            status: 'pending_review',
            submittedAt: timestamp,
            ...fraudReport,
            ipAddress: req.ip || 'unknown', // Capture IP for security
            receivedAt: timestamp
        };

        // Save report (in production, save to database)
        saveReport(reportToSave);

        // Log submission
        console.log(`✓ New fraud report submitted: ${referenceId}`);
        console.log(`  Reporter: ${fraudReport.fullName} <${fraudReport.email}>`);
        console.log(`  Fraud Type: ${fraudReport.fraudType}`);
        console.log(`  Date: ${timestamp}`);

        // Send success response
        return res.status(201).json({
            success: true,
            referenceId: referenceId,
            message: 'Your fraud report has been submitted successfully. We will review it and take appropriate action.',
            timestamp: timestamp,
            nextSteps: 'You should receive a confirmation email shortly.'
        });

    } catch (error) {
        console.error('Error processing fraud report:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing your report. Please try again later.'
        });
    }
});

// Get reports (admin endpoint - should be protected)
app.get('/api/fraud-reports', (req, res) => {
    // In production: Add authentication check here
    try {
        const reports = getReports();
        res.json({
            success: true,
            count: reports.length,
            reports: reports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving reports'
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Fraud Report API running on http://localhost:${PORT}`);
    console.log(`📝 POST http://localhost:${PORT}/api/fraud-reports`);
    console.log(`📊 GET http://localhost:${PORT}/api/fraud-reports`);
    console.log(`🏥 GET http://localhost:${PORT}/api/health`);
});
```

**package.json:**
```json
{
  "name": "fraud-report-api",
  "version": "1.0.0",
  "description": "Backend API for fraud report portal",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
```

**Installation:**
```bash
npm install
npm start
```

## Python/Flask Implementation

**app.py:**
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import os
import uuid

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:8000", "https://your-domain.com"],
        "methods": ["POST", "GET"],
        "allow_headers": ["Content-Type"]
    }
})

REPORTS_FILE = 'fraud_reports.json'

def get_reports():
    if os.path.exists(REPORTS_FILE):
        with open(REPORTS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_report(report):
    reports = get_reports()
    reports.append(report)
    with open(REPORTS_FILE, 'w') as f:
        json.dump(reports, f, indent=2)

def generate_reference_id():
    return f"FRD-{uuid.uuid4().hex[:8].upper()}"

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/fraud-reports', methods=['POST'])
def submit_fraud_report():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['fullName', 'email', 'fraudType', 'description']
        errors = {}

        for field in required_fields:
            if not data.get(field):
                errors[field] = f"{field} is required"

        if errors:
            return jsonify({
                'success': False,
                'message': 'Validation failed',
                'errors': errors
            }), 400

        # Generate reference ID
        reference_id = generate_reference_id()
        timestamp = datetime.utcnow().isoformat()

        # Create report
        report = {
            'referenceId': reference_id,
            'status': 'pending_review',
            'submittedAt': timestamp,
            'receivedAt': timestamp,
            **data
        }

        # Save report
        save_report(report)

        print(f"✓ New fraud report: {reference_id}")
        print(f"  From: {data['fullName']} <{data['email']}>")

        return jsonify({
            'success': True,
            'referenceId': reference_id,
            'message': 'Your fraud report has been submitted successfully',
            'timestamp': timestamp
        }), 201

    except Exception as error:
        print(f"Error: {error}")
        return jsonify({
            'success': False,
            'message': 'An error occurred while processing your report'
        }), 500

@app.route('/api/fraud-reports', methods=['GET'])
def get_fraud_reports():
    reports = get_reports()
    return jsonify({
        'success': True,
        'count': len(reports),
        'reports': reports
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404

if __name__ == '__main__':
    app.run(debug=True, port=3000)
```

**requirements.txt:**
```
Flask==2.3.0
Flask-CORS==4.0.0
```

**Installation:**
```bash
pip install -r requirements.txt
python app.py
```

## Database Integration

### MongoDB Example

**Save to MongoDB:**
```javascript
const mongoose = require('mongoose');

// Schema
const fraudReportSchema = new mongoose.Schema({
    referenceId: { type: String, unique: true, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    fraudType: String,
    fraudDate: Date,
    amount: Number,
    status: { type: String, default: 'pending_review' },
    createdAt: { type: Date, default: Date.now }
});

const FraudReport = mongoose.model('FraudReport', fraudReportSchema);

// Save report
const report = new FraudReport({
    referenceId: generateReferenceId(),
    ...fraudReport
});

await report.save();
```

### PostgreSQL Example

```javascript
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function saveFraudReport(report) {
    const query = `
        INSERT INTO fraud_reports (
            reference_id, full_name, email, fraud_type, 
            fraud_date, amount, description, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING reference_id;
    `;

    const values = [
        report.referenceId,
        report.fullName,
        report.email,
        report.fraudType,
        report.fraudDate,
        report.amount,
        report.description,
        'pending_review'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}
```

## Testing the API

### Using curl

```bash
# Test API health
curl http://localhost:3000/api/health

# Submit fraud report
curl -X POST http://localhost:3000/api/fraud-reports \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "reporterType": "individual",
    "fraudType": "credit_card",
    "fraudDate": "2026-05-15",
    "description": "Unauthorized charges",
    "reportedToOthers": "no",
    "consent": true,
    "privacy": true
  }'

# Get all reports
curl http://localhost:3000/api/fraud-reports
```

### Using Postman

1. Import endpoints into Postman
2. Create POST request to: `http://localhost:3000/api/fraud-reports`
3. Set Body to raw JSON
4. Paste example request
5. Send and view response

## Production Checklist

- [ ] Database connection configured
- [ ] Error logging implemented
- [ ] Rate limiting enabled
- [ ] Authentication/API keys configured
- [ ] Input validation on server-side
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Database backups scheduled
- [ ] Monitoring and alerting set up
- [ ] Logging to file/service
- [ ] Performance optimized
- [ ] Security headers configured
- [ ] Rate limit headers added

---

**Last Updated**: May 30, 2026
