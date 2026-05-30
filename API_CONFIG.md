# API Configuration Guide

This document provides detailed instructions for configuring the Fraud Report Portal to work with your backend API.

## Overview

The Fraud Report Portal is a frontend-only application that sends fraud report data to a backend API. This guide covers:
- API endpoint configuration
- Request/response formats
- Error handling
- Security considerations
- Testing and debugging

## Quick Setup

1. **Configure the API endpoint** in `script.js`:

```javascript
const API_CONFIG = {
    endpoint: 'https://your-api-domain.com/api/fraud-reports',
    timeout: 30000,
    headers: {
        // Add any additional headers if needed
        // 'Authorization': 'Bearer YOUR_API_KEY'
    }
};
```

2. **Test the connection** by opening the website and checking the browser console

## API Requirements

### Endpoint URL
- **Method**: POST
- **Content-Type**: application/json
- **Protocol**: HTTPS (recommended for sensitive data)

### CORS Configuration

Your backend must enable CORS for the frontend domain:

**Example: Node.js/Express**
```javascript
const cors = require('cors');
app.use(cors({
    origin: 'https://your-fraud-report-domain.com',
    methods: ['POST'],
    credentials: true
}));
```

**Example: Python/Flask**
```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "https://your-fraud-report-domain.com"}})
```

**Example: AWS API Gateway**
```json
{
    "Type": "AWS::ApiGateway::Deployment",
    "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "StageName": "prod",
        "Cors": {
            "AllowedMethods": ["POST"],
            "AllowedOrigins": ["https://your-fraud-report-domain.com"]
        }
    }
}
```

## Request Format

The frontend will send a POST request with the following JSON body:

```json
{
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0123",
    "reporterType": "individual",
    "fraudType": "credit_card",
    "fraudDate": "2026-05-15",
    "amount": "5000.00",
    "description": "I noticed unauthorized charges on my credit card...",
    "suspectInfo": "Unknown person, possibly from phishing email",
    "witnesses": "Sarah Smith, coworker",
    "reportedToOthers": "yes",
    "reportedTo": "Bank Fraud Department, FBI",
    "attachments": "Additional email screenshots available upon request",
    "consent": true,
    "privacy": true,
    "submittedAt": "2026-05-30T14:30:00.000Z",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| fullName | string | Reporter's full name |
| email | string | Reporter's email address |
| phone | string | Reporter's phone (optional) |
| reporterType | string | individual, business, organization, or anonymous |
| fraudType | string | Type of fraud reported |
| fraudDate | string | ISO date format (YYYY-MM-DD) |
| amount | string | Amount in USD (can be empty) |
| description | string | Detailed description of the fraud |
| suspectInfo | string | Information about the suspect (optional) |
| witnesses | string | Names of witnesses (optional) |
| reportedToOthers | string | yes or no |
| reportedTo | string | Where else reported (conditional) |
| attachments | string | Additional notes (optional) |
| consent | boolean | Always true if form submitted |
| privacy | boolean | Always true if form submitted |
| submittedAt | string | ISO timestamp when submitted |
| userAgent | string | Browser user agent for tracking |

## Response Format

Your API must respond with a JSON object containing at least:

**Successful Response (200-299)**
```json
{
    "success": true,
    "referenceId": "FRD-2026-00001234",
    "message": "Report submitted successfully",
    "timestamp": "2026-05-30T14:30:15.000Z"
}
```

**Error Response (400-599)**
```json
{
    "success": false,
    "message": "Validation error: Email is required",
    "errors": {
        "email": "Email field cannot be empty"
    }
}
```

### Required Response Fields

- `referenceId` (string): Unique identifier for the report (displayed to user)
- At least one of: `message` or `success` field

### Optional Response Fields

- `message`: Human-readable message
- `success`: Boolean indicating success
- `timestamp`: When processed
- `errors`: Object with field-specific error messages
- `trackingId`: Internal tracking number

## Example Implementations

### Node.js / Express

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/fraud-reports', async (req, res) => {
    try {
        const fraudReport = req.body;
        
        // Validate required fields
        const requiredFields = ['fullName', 'email', 'fraudType', 'description'];
        for (const field of requiredFields) {
            if (!fraudReport[field]) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required field: ${field}`
                });
            }
        }
        
        // Generate reference ID
        const referenceId = `FRD-${Date.now()}`;
        
        // Save to database
        const report = await FraudReport.create({
            ...fraudReport,
            referenceId,
            status: 'pending_review'
        });
        
        // Log submission
        console.log(`New fraud report: ${referenceId}`);
        
        // Send confirmation email (optional)
        // await sendConfirmationEmail(fraudReport.email, referenceId);
        
        res.status(201).json({
            success: true,
            referenceId,
            message: 'Your fraud report has been submitted successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error processing fraud report:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your report'
        });
    }
});

app.listen(3000, () => {
    console.log('Fraud report API listening on port 3000');
});
```

### Python / Flask

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

@app.route('/api/fraud-reports', methods=['POST'])
def submit_fraud_report():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['fullName', 'email', 'fraudType', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Generate reference ID
        reference_id = f"FRD-{uuid.uuid4().hex[:8].upper()}"
        
        # Create report object
        fraud_report = {
            'referenceId': reference_id,
            'status': 'pending_review',
            'submittedAt': datetime.utcnow().isoformat(),
            **data
        }
        
        # Save to database
        # db.fraud_reports.insert_one(fraud_report)
        
        print(f"New fraud report: {reference_id}")
        
        return jsonify({
            'success': True,
            'referenceId': reference_id,
            'message': 'Your fraud report has been submitted successfully',
            'timestamp': datetime.utcnow().isoformat()
        }), 201
        
    except Exception as error:
        print(f"Error processing fraud report: {error}")
        return jsonify({
            'success': False,
            'message': 'An error occurred while processing your report'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=3000)
```

## Authentication

If your API requires authentication:

1. Update `script.js`:
```javascript
const API_CONFIG = {
    endpoint: 'https://your-api-domain.com/api/fraud-reports',
    timeout: 30000,
    headers: {
        'Authorization': 'Bearer YOUR_API_KEY_HERE',
        'X-API-Key': 'YOUR_API_KEY_HERE'
    }
};
```

2. For JWT tokens, implement token refresh logic in `script.js` if needed

## Error Handling

The frontend handles various error scenarios:

| Scenario | Status | Handling |
|----------|--------|----------|
| Network error | N/A | "Network error. Please check your connection" |
| Timeout (30s) | N/A | "Request timed out. Please try again" |
| HTTP 400 | 400 | Shows server error message |
| HTTP 500 | 500 | "An error occurred while processing" |
| Invalid response | N/A | "Invalid response from server" |

## Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
// Server-side (Express example)
const rateLimit = require('express-rate-limit');

const fraudReportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per windowMs
    message: 'Too many fraud reports submitted, please try again later'
});

app.post('/api/fraud-reports', fraudReportLimiter, (req, res) => {
    // ... your code
});
```

## Data Storage & Compliance

### Recommended Storage Locations
- SQL Database (PostgreSQL, MySQL, SQL Server)
- NoSQL Database (MongoDB, DynamoDB)
- Cloud Storage (AWS S3, Azure Blob Storage)
- Data Warehouse (Snowflake, BigQuery)

### Compliance Considerations
- **GDPR**: Implement data retention policies and right to deletion
- **CCPA**: Allow users to request their data
- **HIPAA**: If health-related data, ensure compliance
- **PCI DSS**: Don't store credit card numbers
- **Encryption**: Encrypt sensitive data at rest and in transit

### Data Retention Policy
```
- Reports: Keep for 2 years minimum
- Logs: Keep for 90 days
- Personal Data: Delete upon request (GDPR)
- Investigation Records: Keep as per legal requirements
```

## Testing

### Manual Testing with curl

```bash
curl -X POST https://your-api-domain.com/api/fraud-reports \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "reporterType": "individual",
    "fraudType": "credit_card",
    "fraudDate": "2026-05-15",
    "description": "Test fraud report",
    "reportedToOthers": "no",
    "consent": true,
    "privacy": true
  }'
```

### Testing in Browser Console

```javascript
// Test API endpoint
const testData = {
    fullName: "Test User",
    email: "test@example.com",
    reporterType: "individual",
    fraudType: "credit_card",
    fraudDate: "2026-05-15",
    description: "Test report",
    reportedToOthers: "no",
    consent: true,
    privacy: true,
    submittedAt: new Date().toISOString(),
    userAgent: navigator.userAgent
};

fetch(API_CONFIG.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(e => console.error('Error:', e));
```

## Troubleshooting

### CORS Error
- Check browser console for "Access to XMLHttpRequest blocked by CORS"
- Solution: Configure CORS on backend to allow frontend domain

### 404 Not Found
- Check endpoint URL is correct in `API_CONFIG`
- Verify backend API is running

### 500 Internal Server Error
- Check backend logs for detailed error
- Verify database connection
- Check for validation errors

### Timeout
- Increase `timeout` value in `API_CONFIG`
- Check network connectivity
- Verify backend performance

## Support

For technical questions or issues:
- Check browser console (F12) for error messages
- Review backend server logs
- Test API with curl or Postman
- Enable debug logging in frontend

---

**Last Updated**: May 30, 2026
