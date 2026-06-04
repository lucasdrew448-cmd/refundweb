// ===========================
// Fraud Report Portal - JavaScript
// ===========================

// Configuration
const API_CONFIG = {
    // Replace this with your actual API endpoint
    endpoint: 'https://your-api-domain.com/api/fraud-reports',
    timeout: 30000, // 30 seconds
    // If your API requires authentication
    // headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
};

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const fraudForm = document.getElementById('fraudForm');
    
    // Form submission handler
    if (fraudForm) {
        fraudForm.addEventListener('submit', handleFormSubmit);
    }

    // Show/hide "reported to" field based on radio selection
    const reportedToRadios = document.querySelectorAll('input[name="reportedToOthers"]');
    reportedToRadios.forEach(radio => {
        radio.addEventListener('change', toggleReportedToField);
    });

    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', toggleHamburgerMenu);
        
        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', closeHamburgerMenu);
        });
    }
});

// ===========================
// Form Submission Handler
// ===========================

async function handleFormSubmit(event) {
    event.preventDefault();

    // Get form data
    const formData = new FormData(document.getElementById('fraudForm'));
    const data = Object.fromEntries(formData);

    // Validate form
    if (!validateForm(data)) {
        return;
    }

    // Disable submit button to prevent double submission
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Show loading message
    showLoadingMessage('Submitting your fraud report...');

    try {
        // Send data to API
        const response = await sendToAPI(data);

        // Handle successful response
        showSuccessMessage(response);

        // Reset form
        document.getElementById('fraudForm').reset();

        // Scroll to success message
        scrollToElement('successMessage');

    } catch (error) {
        console.error('Error submitting form:', error);
        showErrorMessage(error.message || 'An error occurred while submitting your report. Please try again.');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ===========================
// API Communication
// ===========================

async function sendToAPI(data) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
        const response = await fetch(API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...API_CONFIG.headers
            },
            body: JSON.stringify({
                ...data,
                submittedAt: new Date().toISOString(),
                userAgent: navigator.userAgent
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
            let errorMessage = `Server returned status ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // If response is not JSON, use default error message
            }
            throw new Error(errorMessage);
        }

        // Parse successful response
        const responseData = await response.json();

        // Validate response contains required data
        if (!responseData.referenceId) {
            throw new Error('Invalid response from server: missing reference ID');
        }

        return responseData;

    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your connection and try again.');
        }

        if (error instanceof TypeError) {
            throw new Error('Network error. Please check your connection and try again.');
        }

        throw error;
    }
}

// ===========================
// Form Validation
// ===========================

function validateForm(data) {
    // Check required fields
    const requiredFields = [
        'fullName',
        'email',
        'reporterType',
        'fraudType',
        'fraudDate',
        'description',
        'reportedToOthers',
        'consent',
        'privacy'
    ];

    for (const field of requiredFields) {
        if (!data[field]) {
            showErrorMessage(`Please fill in all required fields. Missing: ${field}`);
            return false;
        }
    }

    // Validate email format
    if (!isValidEmail(data.email)) {
        showErrorMessage('Please enter a valid email address.');
        return false;
    }

    // Validate amount if provided
    if (data.amount && isNaN(parseFloat(data.amount))) {
        showErrorMessage('Please enter a valid amount.');
        return false;
    }

    // If reported to others, check if reported to field is filled
    if (data.reportedToOthers === 'yes' && !data.reportedTo) {
        showErrorMessage('Please specify where you reported the fraud.');
        return false;
    }

    return true;
}

// ===========================
// Utility Functions
// ===========================

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function toggleReportedToField() {
    const reportedToGroup = document.getElementById('reportedToGroup');
    const reportedToRadios = document.querySelectorAll('input[name="reportedToOthers"]');
    
    for (const radio of reportedToRadios) {
        if (radio.checked && radio.value === 'yes') {
            reportedToGroup.style.display = 'block';
            document.getElementById('reportedTo').required = true;
            break;
        } else if (radio.checked && radio.value === 'no') {
            reportedToGroup.style.display = 'none';
            document.getElementById('reportedTo').required = false;
            break;
        }
    }
}

function toggleHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}

function closeHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}

function showLoadingMessage(message) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.className = 'status-message loading';
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    scrollToElement('statusMessage');
}

function showErrorMessage(message) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.className = 'status-message error';
    statusMessage.innerHTML = `<strong>Error:</strong> ${message}`;
    statusMessage.style.display = 'block';
    scrollToElement('statusMessage');
}

function showSuccessMessage(response) {
    const successMessage = document.getElementById('successMessage');
    const referenceId = document.getElementById('referenceId');
    
    referenceId.textContent = response.referenceId || 'N/A';
    successMessage.style.display = 'block';
    
    // Hide any error messages
    document.getElementById('statusMessage').style.display = 'none';
}

function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// ===========================
// Local Storage Functions
// ===========================

// Save form progress to local storage (auto-save)
function autoSaveForm() {
    const formData = new FormData(document.getElementById('fraudForm'));
    const data = Object.fromEntries(formData);
    localStorage.setItem('fraudFormDraft', JSON.stringify(data));
}

// Load form progress from local storage
function loadFormDraft() {
    const draft = localStorage.getItem('fraudFormDraft');
    if (draft) {
        const data = JSON.parse(draft);
        const form = document.getElementById('fraudForm');
        
        for (const [key, value] of Object.entries(data)) {
            const field = form.elements[key];
            if (field) {
                if (field.type === 'radio') {
                    const radioButton = form.querySelector(`input[name="${key}"][value="${value}"]`);
                    if (radioButton) {
                        radioButton.checked = true;
                        toggleReportedToField();
                    }
                } else if (field.type === 'checkbox') {
                    field.checked = value === 'on' || value === true;
                } else {
                    field.value = value;
                }
            }
        }
    }
}

// Clear form draft
function clearFormDraft() {
    localStorage.removeItem('fraudFormDraft');
}

// ===========================
// Advanced Features (Optional)
// ===========================

// Character counter for textareas
document.addEventListener('DOMContentLoaded', function() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            // You can add a character counter display here if needed
            const maxChars = 5000;
            if (this.value.length > maxChars) {
                this.value = this.value.substring(0, maxChars);
            }
        });
    });

    // Auto-save form draft
    const fraudForm = document.getElementById('fraudForm');
    if (fraudForm) {
        // Load draft if exists
        loadFormDraft();

        // Auto-save every 30 seconds
        setInterval(() => {
            autoSaveForm();
        }, 30000);

        // Save on form input
        fraudForm.addEventListener('input', () => {
            // Debounce auto-save
            clearTimeout(window.autoSaveTimeout);
            window.autoSaveTimeout = setTimeout(autoSaveForm, 5000);
        });
    }
});

// ===========================
// Error Logging (Optional)
// ===========================

function logError(error, context = {}) {
    const errorData = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        context: context,
        userAgent: navigator.userAgent
    };

    console.error('Fraud Report Error:', errorData);

    // Optionally send to error tracking service
    // sendErrorToService(errorData);
}

// ===========================
// Print Report (Optional)
// ===========================

function printReport() {
    const form = document.getElementById('fraudForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    let printContent = 'FRAUD REPORT\n';
    printContent += '='.repeat(50) + '\n\n';
    printContent += `Submitted: ${new Date().toLocaleString()}\n\n`;

    for (const [key, value] of Object.entries(data)) {
        const label = key.replace(/([A-Z])/g, ' $1').toUpperCase();
        printContent += `${label}: ${value}\n`;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<pre>' + printContent + '</pre>');
    printWindow.document.close();
    printWindow.print();
}

// ===========================
// Offline Detection
// ===========================

window.addEventListener('online', () => {
    console.log('Online');
    // Show notification that connection is restored
});

window.addEventListener('offline', () => {
    console.log('Offline');
    showErrorMessage('You appear to be offline. Your report will be saved as a draft and can be submitted when your connection is restored.');
});

// ===========================
// Accessibility Enhancements
// ===========================



// Add CSS for skip link (add to styles.css)
// .skip-link {
//     position: absolute;
//     top: -40px;
//     left: 0;
//     background: #000;
//     color: white;
//     padding: 8px;
//     z-index: 100;
// }
// .skip-link:focus {
//     top: 0;
// }
