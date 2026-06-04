# Fraud Report Portal

A professional, frontend-only website for users to securely report fraud. This application collects fraud reports and sends them to a backend API for processing.

## Features

- **Comprehensive Fraud Reporting Form** with multiple fraud types
- **Responsive Design** - works on desktop, tablet, and mobile devices
- **Form Validation** - client-side validation of all required fields
- **API Integration** - sends reports to a backend service
- **Auto-save Draft** - automatically saves form progress to local storage
- **Offline Support** - detects and alerts users about offline status
- **Professional UI** - modern, clean, and accessible design
- **FAQ Section** - answers common questions about fraud reporting
- **Contact Information** - easy access to support details

## Project Structure

```
refundweb/
├── index.html           # Main HTML file with form structure
├── styles.css          # Complete CSS styling
├── script.js           # JavaScript for form handling and API calls
├── README.md           # This file
├── API_CONFIG.md       # API configuration guide
└── DEPLOYMENT.md       # Deployment instructions
```

## File Descriptions

### index.html
- Complete HTML structure with semantic markup
- Sections: Header, Hero, Report Form, FAQ, Contact, Footer
- Form includes multiple fieldsets for organized input
- Accessibility features and proper form labeling

### styles.css
- Mobile-first responsive design
- CSS variables for consistent theming
- Gradient backgrounds and modern styling
- Accessibility enhancements (focus states, high contrast)
- Print-friendly styles

### script.js
- Form submission handling
- API communication with error handling
- Form validation
- Local storage auto-save functionality
- Offline detection
- Accessibility enhancements

## Configuration

### API Endpoint Setup

Before deploying, you need to configure your API endpoint:

1. Open `script.js`
2. Find the `API_CONFIG` object at the top
3. Update the `endpoint` URL to your backend service:

```javascript
const API_CONFIG = {
    endpoint: 'https://your-api-domain.com/api/fraud-reports',
    timeout: 30000,
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' } // If needed
};
```

### Expected API Response

Your backend API should return a JSON response with at least:

```json
{
    "success": true,
    "referenceId": "FRD-2026-00001234",
    "message": "Report submitted successfully"
}
```

### Expected Request Format

The frontend will send the following JSON:

```json
{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123",
    "reporterType": "individual",
    "fraudType": "credit_card",
    "fraudDate": "2026-05-15",
    "amount": "5000.00",
    "description": "Detailed description of fraud...",
    "suspectInfo": "Suspect details...",
    "witnesses": "Witness names...",
    "reportedToOthers": "yes",
    "reportedTo": "FBI",
    "attachments": "Additional notes...",
    "consent": true,
    "privacy": true,
    "submittedAt": "2026-05-30T12:34:56.789Z",
    "userAgent": "Mozilla/5.0..."
}
```

## Running Locally

### Option 1: Using Python (Recommended)
```bash
python -m http.server 8000
# Visit http://localhost:8000
```

### Option 2: Using Node.js
```bash
npx http-server
# Visit http://localhost:8080
```

### Option 3: Using Live Server (VS Code Extension)
- Install "Live Server" extension
- Right-click on index.html
- Select "Open with Live Server"

## Features in Detail

### Form Sections

1. **Your Information**
   - Full Name (required)
   - Email Address (required)
   - Phone Number (optional)
   - Reporter Type (required)

2. **Fraud Details**
   - Type of Fraud (required) - 9 different categories
   - Date of Incident (required)
   - Amount (USD) (optional)
   - Detailed Description (required)
   - Suspect Information (optional)

3. **Evidence & Supporting Information**
   - Witnesses (optional)
   - Reported to Others (required)
   - Where Reported (conditional - shows if "yes" selected)
   - Additional Notes (optional)

4. **Privacy & Consent**
   - Investigation consent (required)
   - Privacy policy agreement (required)

### Form Validation

- All required fields must be filled
- Email format validation
- Amount field accepts only numbers
- Date field uses HTML5 date picker
- Phone field accepts international formats
- Conditional field visibility based on user input

### Auto-Save Feature

- Form data automatically saved to browser's local storage
- Saves every 30 seconds or 5 seconds after user input
- Restores saved data when user returns to the page
- Clears saved data after successful submission

### Error Handling

- Network error detection and user-friendly messages
- API timeout handling (30-second default)
- HTTP error status handling with error messages
- Form validation errors with specific field identification
- Offline detection with alert to users

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Semantic HTML structure
- ARIA labels and roles where appropriate
- Keyboard navigation support
- High contrast text
- Focus indicators for all interactive elements
- Form validation announcements

## Security Considerations

- All API calls use HTTPS (ensure your backend is HTTPS)
- Form data is not stored locally after successful submission
- CORS should be configured on your backend API
- Implement rate limiting on your API to prevent abuse
- Validate all data on the server side
- Use proper authentication if needed

## Customization

### Change Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #2c3e50;
    --secondary-color: #e74c3c;
    --success-color: #27ae60;
    /* ... */
}
```

### Change Contact Information
Update the contact section in `index.html`:
```html
<a href="mailto:your-email@example.com">your-email@example.com</a>
```

### Add More Fraud Types
Add options to the fraud type dropdown in `index.html`:
```html
<option value="your_type">Your Fraud Type</option>
```

### Modify Form Fields
Edit fieldsets in `index.html` to add/remove form fields as needed

## Testing

### Test Form Submission (Without Real Backend)

1. Open browser console (F12)
2. Add this temporary code to test locally:
```javascript
// Temporarily replace API call for testing
const API_CONFIG = {
    endpoint: 'about:blank'
};

async function sendToAPI(data) {
    return {
        referenceId: 'TEST-' + Date.now()
    };
}
```

### Common Issues

- **CORS Errors**: Configure CORS on your backend API
- **Timeout Errors**: Check your API endpoint is accessible
- **Form not submitting**: Check browser console for JavaScript errors
- **Local storage not working**: May be disabled in private/incognito mode

## Deployment

### Static Hosting Options
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Azure Static Web Apps
- Any web server (Apache, Nginx, etc.)

### Steps
1. Replace API endpoint in `script.js`
2. Update contact information in `index.html`
3. Upload all three files to your hosting
4. Ensure HTTPS is enabled
5. Configure CORS on backend if needed

## Support

For issues or questions, contact: fraud@c2security.com

## License

© 2026 C2 Cybersecurity. All rights reserved.

---

**Last Updated**: May 30, 2026
