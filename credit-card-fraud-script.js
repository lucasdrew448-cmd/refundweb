// ===========================
// Credit Card Fraud Report - JavaScript
// ===========================

// Configuration
const CC_FRAUD_API_CONFIG = {
    // Replace this with your actual API endpoint
    endpoint: 'https://your-api-domain.com/api/cc-fraud-reports',
    timeout: 30000, // 30 seconds
};

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const ccFraudForm = document.getElementById('ccFraudForm');
    
    // Form submission handler
    if (ccFraudForm) {
        ccFraudForm.addEventListener('submit', handleCCFraudSubmit);
    }

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

    // Auto-save form draft
    if (ccFraudForm) {
        loadCCFraudFormDraft();
        setInterval(() => {
            autoSaveCCFraudForm();
        }, 30000);

        ccFraudForm.addEventListener('input', () => {
            clearTimeout(window.autoSaveTimeout);
            window.autoSaveTimeout = setTimeout(autoSaveCCFraudForm, 5000);
        });

        ccFraudForm.addEventListener('change', () => {
            clearTimeout(window.autoSaveTimeout);
            window.autoSaveTimeout = setTimeout(autoSaveCCFraudForm, 5000);
        });
    }

    // Validate account number format (only numbers)
    const accountNumberInput = document.getElementById('accountNumber');
    if (accountNumberInput) {
        accountNumberInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '');
            if (this.value.length > 4) {
                this.value = this.value.slice(0, 4);
            }
        });
    }
});

// ===========================
// Form Submission Handler
// ===========================

async function handleCCFraudSubmit(event) {
    event.preventDefault();

    const formData = new FormData(document.getElementById('ccFraudForm'));
    const data = Object.fromEntries(formData);
    
    // Handle checkboxes (multiple values)
    data.actionsTaken = document.querySelectorAll('input[name="actions"]:checked');
    data.actionsTaken = Array.from(data.actionsTaken).map(cb => cb.value);

    if (!validateCCFraudForm(data)) {
        return;
    }

    const submitBtn = document.querySelector('#ccFraudForm .submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    showCCLoadingMessage('Submitting your credit card fraud report...');

    try {
        const response = await sendCCFraudToAPI(data);
        showCCSuccessMessage(response);
        document.getElementById('ccFraudForm').reset();
        clearCCFraudFormDraft();
        scrollToElement('successMessage');
    } catch (error) {
        console.error('Error submitting credit card fraud form:', error);
        showCCErrorMessage(error.message || 'An error occurred while submitting your report. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ===========================
// API Communication
// ===========================

async function sendCCFraudToAPI(data) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CC_FRAUD_API_CONFIG.timeout);

    try {
        const response = await fetch(CC_FRAUD_API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...data,
                submittedAt: new Date().toISOString(),
                userAgent: navigator.userAgent
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMessage = `Server returned status ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // Default error message
            }
            throw new Error(errorMessage);
        }

        const responseData = await response.json();

        if (!responseData.reportId) {
            throw new Error('Invalid response from server: missing report ID');
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

function validateCCFraudForm(data) {
    const requiredFields = [
        'fullName',
        'email',
        'accountNumber',
        'cardType',
        'cardIssuer',
        'cardStatus',
        'fraudDate',
        'totalAmount',
        'chargeCount',
        'chargeDetails',
        'fraudType',
        'consent',
        'privacy',
        'noFullCardNumber'
    ];

    for (const field of requiredFields) {
        if (!data[field]) {
            showCCErrorMessage(`Please fill in all required fields. Missing: ${field}`);
            return false;
        }
    }

    if (!isValidEmail(data.email)) {
        showCCErrorMessage('Please enter a valid email address.');
        return false;
    }

    if (data.accountNumber.length !== 4 || !/^\d{4}$/.test(data.accountNumber)) {
        showCCErrorMessage('Please enter the last 4 digits of your card.');
        return false;
    }

    const totalAmount = parseFloat(data.totalAmount);
    const chargeCount = parseInt(data.chargeCount);

    if (isNaN(totalAmount) || totalAmount <= 0) {
        showCCErrorMessage('Please enter a valid total amount.');
        return false;
    }

    if (isNaN(chargeCount) || chargeCount < 1) {
        showCCErrorMessage('Please enter a valid number of charges.');
        return false;
    }

    if (!data.consent || !data.privacy || !data.noFullCardNumber) {
        showCCErrorMessage('Please agree to all terms and confirmations.');
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

function showCCLoadingMessage(message) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.className = 'status-message loading';
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    scrollToElement('statusMessage');
}

function showCCErrorMessage(message) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.className = 'status-message error';
    statusMessage.innerHTML = `<strong>Error:</strong> ${message}`;
    statusMessage.style.display = 'block';
    scrollToElement('statusMessage');
}

function showCCSuccessMessage(response) {
    const successMessage = document.getElementById('successMessage');
    const reportId = document.getElementById('reportId');
    
    reportId.textContent = response.reportId || 'N/A';
    successMessage.style.display = 'block';
    
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
// Hamburger Menu
// ===========================

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

// ===========================
// Local Storage Functions
// ===========================

function autoSaveCCFraudForm() {
    const formData = new FormData(document.getElementById('ccFraudForm'));
    const data = Object.fromEntries(formData);
    
    // Get selected action checkboxes
    const actions = document.querySelectorAll('input[name="actions"]:checked');
    data.actions = Array.from(actions).map(cb => cb.value).join(',');
    
    localStorage.setItem('ccFraudFormDraft', JSON.stringify(data));
}

function loadCCFraudFormDraft() {
    const draft = localStorage.getItem('ccFraudFormDraft');
    if (draft) {
        const data = JSON.parse(draft);
        const form = document.getElementById('ccFraudForm');
        
        for (const [key, value] of Object.entries(data)) {
            if (key === 'actions' && value) {
                // Handle action checkboxes
                const actionValues = value.split(',');
                actionValues.forEach(action => {
                    const checkbox = form.querySelector(`input[name="actions"][value="${action}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            } else {
                const field = form.elements[key];
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = value === 'on' || value === true;
                    } else {
                        field.value = value;
                    }
                }
            }
        }
    }
}

function clearCCFraudFormDraft() {
    localStorage.removeItem('ccFraudFormDraft');
}

// ===========================
// Security Checks
// ===========================

// Warn user if they try to paste a full credit card number
document.addEventListener('paste', function(e) {
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    
    // Check if pasted text looks like a credit card number (16+ consecutive digits)
    if (/\d{16,}/.test(pastedText.replace(/\D/g, ''))) {
        e.preventDefault();
        alert('⚠️ Security Warning: Do not paste full credit card numbers! Only enter the last 4 digits.');
        return false;
    }
});
