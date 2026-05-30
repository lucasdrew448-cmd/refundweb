# Deployment Guide

This guide provides step-by-step instructions for deploying the Fraud Report Portal to various hosting platforms.

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] API endpoint is configured correctly in `script.js`
- [ ] Backend API is ready and tested
- [ ] CORS is configured on backend
- [ ] SSL/HTTPS certificate is valid
- [ ] Contact information is updated in `index.html`
- [ ] All files are included (index.html, styles.css, script.js)
- [ ] Tested locally and works correctly
- [ ] Browser compatibility verified

## Deployment Methods

### 1. GitHub Pages (Free, Fast Setup)

**Pros**: Free, automatic HTTPS, simple setup
**Cons**: Limited to static sites, no server-side processing

**Steps:**

1. Create a GitHub repository
2. Push files to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Fraud Report Portal"
   git remote add origin https://github.com/YOUR_USERNAME/fraud-report-portal.git
   git branch -M main
   git push -u origin main
   ```

3. Go to repository Settings > Pages
4. Set source to "main" branch
5. Website will be available at: `https://YOUR_USERNAME.github.io/fraud-report-portal`

### 2. Netlify (Free Plan Available)

**Pros**: Easy CI/CD, auto-deployment, good performance
**Cons**: Limited free tier

**Steps:**

1. Sign up at netlify.com
2. Connect GitHub repository or use drag-and-drop
3. Basic Settings:
   - Build command: (leave empty for static site)
   - Publish directory: / (root)
4. Deploy
5. Access at provided URL

**For Custom Domain:**
- Go to Domain settings
- Add custom domain
- Follow DNS configuration instructions

### 3. Vercel (Free Plan Available)

**Pros**: Excellent performance, serverless functions available
**Cons**: Can be complex for advanced features

**Steps:**

1. Sign up at vercel.com
2. Import Git repository
3. Configure project:
   - Framework: Other (static)
   - Root Directory: ./
4. Deploy
5. Assign custom domain in project settings

### 4. AWS S3 + CloudFront

**Pros**: Scalable, reliable, good for high traffic
**Cons**: More complex setup, costs involved

**Steps:**

1. Create S3 bucket:
   ```bash
   aws s3 mb s3://your-fraud-report-portal --region us-east-1
   ```

2. Enable static website hosting:
   ```bash
   aws s3 website s3://your-fraud-report-portal/ \
       --index-document index.html
   ```

3. Upload files:
   ```bash
   aws s3 cp index.html s3://your-fraud-report-portal/
   aws s3 cp styles.css s3://your-fraud-report-portal/
   aws s3 cp script.js s3://your-fraud-report-portal/
   ```

4. Make files public:
   ```bash
   aws s3api put-bucket-policy \
       --bucket your-fraud-report-portal \
       --policy file://bucket-policy.json
   ```

5. Create CloudFront distribution:
   - Origin: S3 website endpoint
   - Default root object: index.html
   - Enable HTTPS
   - Custom domain (optional)

**bucket-policy.json:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-fraud-report-portal/*"
        }
    ]
}
```

### 5. Azure Static Web Apps

**Pros**: Integrated with Azure ecosystem, good for enterprises
**Cons**: Learning curve

**Steps:**

1. Sign in to Azure Portal
2. Create "Static Web App" resource
3. Connect GitHub repository
4. Configure build settings:
   - App location: /
   - Output location: (leave blank)
5. Review and create
6. GitHub Actions will automatically deploy

### 6. Traditional Web Hosting (cPanel/Apache)

**Steps:**

1. Prepare files locally
2. Connect via FTP/SFTP:
   ```bash
   sftp user@your-domain.com
   put index.html
   put styles.css
   put script.js
   exit
   ```

3. Or use File Manager in cPanel:
   - Upload files to `public_html` folder
   - Ensure correct permissions (644 for files)

4. Access via browser:
   - https://your-domain.com/

### 7. Docker Container

**Dockerfile:**
```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Build and run:**
```bash
docker build -t fraud-report-portal .
docker run -p 80:80 fraud-report-portal
```

### 8. Local/Self-Hosted Server

**Using Python:**
```bash
python -m http.server 8000
# Visit http://localhost:8000
```

**Using Node.js:**
```bash
npx http-server
# Visit http://localhost:8080
```

**Using Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /var/www/html;
        try_files $uri $uri/ =404;
    }
}
```

## Post-Deployment Configuration

### 1. Update API Endpoint

After deployment, ensure your frontend can reach the backend API:

1. Test API connectivity:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Submit a test report
   - Check network requests

2. Common issues and solutions:
   - **CORS error**: Configure CORS on backend
   - **Timeout**: Check backend is running and accessible
   - **400 Bad Request**: Verify request format matches backend expectations

### 2. Monitor Performance

Set up monitoring tools:
- Google Analytics for user tracking
- Sentry for error tracking
- CloudFlare for DDoS protection and analytics

### 3. Enable HTTPS

Ensure SSL/TLS certificate is installed:
- Use Let's Encrypt (free)
- Buy from certificate authority
- Verify in browser address bar

### 4. Configure CDN (Optional)

For better performance:
- CloudFlare: Free tier available
- AWS CloudFront: Good for AWS deployments
- Bunny CDN: Cost-effective option

## Updating Your Site

### Method 1: Git/GitHub
```bash
# Make local changes
git add .
git commit -m "Update fraud types"
git push
# Auto-deployed (depending on platform)
```

### Method 2: Direct Upload (FTP/SFTP)
1. Connect via FTP
2. Upload updated files
3. Overwrite existing files

### Method 3: Platform Dashboard
1. Log into hosting platform
2. Use file manager to upload
3. Or use drag-and-drop deployment

## Security Best Practices

### 1. HTTPS Only
```javascript
// Force HTTPS in index.html
if (window.location.protocol === 'http:') {
    window.location.protocol = 'https:';
}
```

### 2. Content Security Policy
Add to index.html `<head>`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';">
```

### 3. X-Frame-Options
Prevent clickjacking (configure on server):
```
X-Frame-Options: SAMEORIGIN
```

### 4. HSTS (HTTP Strict Transport Security)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 5. Rate Limiting
Configure on your backend API to prevent abuse

### 6. Input Validation
- Frontend: Already implemented
- Backend: Always validate server-side (don't trust frontend)

## Performance Optimization

### 1. Minify Assets
```bash
# Minify CSS
npx csso styles.css -o styles.min.css

# Minify JavaScript
npx terser script.js -o script.min.js

# Update index.html to use minified versions
```

### 2. Enable Compression
Nginx:
```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
```

### 3. Browser Caching
Set cache headers:
```
Cache-Control: max-age=3600
```

### 4. Lazy Load Images (if added)
```html
<img src="image.jpg" loading="lazy">
```

## Troubleshooting Deployment Issues

### Issue: "404 Not Found"
- **Cause**: Files not uploaded correctly
- **Solution**: Verify all three files uploaded to correct location

### Issue: "API endpoint not reachable"
- **Cause**: Backend not running or wrong endpoint
- **Solution**: Check API_CONFIG in script.js, test with curl

### Issue: "CORS blocked"
- **Cause**: Backend CORS not configured
- **Solution**: Configure CORS on backend for frontend domain

### Issue: "Slow loading"
- **Cause**: Poor server or network
- **Solution**: Use CDN, optimize backend, check server resources

### Issue: "Submit button doesn't work"
- **Cause**: JavaScript error or form validation
- **Solution**: Check browser console for errors

## Rollback Procedure

If deployment has issues:

1. **GitHub Pages**: Revert commit and push
   ```bash
   git revert HEAD
   git push
   ```

2. **Netlify**: Disable auto-deploy, manually rollback in UI

3. **FTP/Traditional**: Upload previous version of files

4. **Docker**: Stop container, run previous image version

## Maintenance Schedule

- **Weekly**: Check error logs
- **Monthly**: Review analytics and user feedback
- **Quarterly**: Security updates, dependency checks
- **Annually**: Review and update contact information

## Monitoring Checklist

- [ ] SSL certificate expiration
- [ ] API uptime and performance
- [ ] Error rate and patterns
- [ ] User volume and trends
- [ ] Backend database storage
- [ ] Server resource usage

## Getting Help

If deployment fails:

1. Check platform-specific documentation
2. Review browser console errors (F12)
3. Test API with curl/Postman
4. Verify all files are uploaded
5. Check firewall/security group rules
6. Contact platform support

---

**Last Updated**: May 30, 2026
