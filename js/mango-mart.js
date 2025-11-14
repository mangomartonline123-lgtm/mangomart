// Mango Mart - Complete Application Bundle
// This file contains all the modules bundled together for direct HTML opening

// ===== UTILITY FUNCTIONS =====
// Global error handlers to avoid blank screens
window.addEventListener('error', (e) => {
    try {
        const app = document.getElementById('app');
        if (app && !app.dataset.errorShown) {
            app.dataset.errorShown = '1';
            app.innerHTML = `
                <div class="min-h-screen flex items-center justify-center p-4">
                    <div class="bg-white rounded-lg shadow p-6 max-w-lg w-full text-center">
                        <h2 class="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
                        <p class="text-gray-600 mb-4">The page failed to load. Please refresh. If the issue persists, contact support.</p>
                        <pre class="text-left text-xs bg-gray-50 p-3 rounded overflow-auto">${(e?.error?.stack || e.message || 'Unknown error')}</pre>
                    </div>
                </div>`;
        }
        console.error('Global error caught:', e?.error || e);
    } catch {}
});

window.addEventListener('unhandledrejection', (e) => {
    try {
        const app = document.getElementById('app');
        if (app && !app.dataset.errorShown) {
            app.dataset.errorShown = '1';
            app.innerHTML = `
                <div class="min-h-screen flex items-center justify-center p-4">
                    <div class="bg-white rounded-lg shadow p-6 max-w-lg w-full text-center">
                        <h2 class="text-xl font-semibold text-gray-900 mb-2">Unexpected error</h2>
                        <p class="text-gray-600 mb-4">Please try again. If it keeps happening, contact support.</p>
                        <pre class="text-left text-xs bg-gray-50 p-3 rounded overflow-auto">${(e?.reason?.message || e?.reason || 'Unknown rejection')}</pre>
                    </div>
                </div>`;
        }
        console.error('Unhandled promise rejection:', e?.reason || e);
    } catch {}
});

// ===== EMAIL & SMS SERVICE CONFIGURATION =====
// Configure your EmailJS settings here
const EMAIL_SERVICE_CONFIG = {
    // Get these from https://www.emailjs.com/
    serviceId: 'service_glx6i6y', // EmailJS service ID
    templateId: 'template_7pozr0c', // EmailJS template ID
    publicKey: 'FFsDb91I7_HTbb_Rq' // EmailJS public key
};

// SMS Service Configuration
// Option 1: TextLocal (Recommended for India) - https://www.textlocal.in/
// Option 2: MSG91 - https://msg91.com/
// Option 3: Twilio (requires backend)
const SMS_SERVICE_CONFIG = {
    provider: 'textlocal', // 'textlocal', 'msg91', 'twilio', or 'none'
    apiKey: 'YOUR_SMS_API_KEY', // Get from your SMS provider
    senderId: 'MANGO', // Your SMS sender ID (6 characters max for TextLocal)
    // TextLocal specific
    textlocalApiKey: 'YOUR_TEXTLOCAL_API_KEY', // Get from https://www.textlocal.in/
    // MSG91 specific
    msg91AuthKey: 'YOUR_MSG91_AUTH_KEY', // Get from https://msg91.com/
    msg91TemplateId: 'YOUR_TEMPLATE_ID' // Get from MSG91 dashboard
};

// Email & SMS Service Functions
const notificationService = {
    emailjsInitialized: false,

    // Initialize EmailJS
    initEmailJS() {
        if (typeof emailjs !== 'undefined') {
            try {
                emailjs.init(EMAIL_SERVICE_CONFIG.publicKey);
                this.emailjsInitialized = true;
                return true;
            } catch (error) {
                console.error('EmailJS initialization error:', error);
                return false;
            }
        }
        return false;
    },

    // Send email via EmailJS
    async sendEmail(toEmail, subject, message) {
        try {
            if (typeof emailjs === 'undefined') {
                throw new Error('EmailJS library not loaded. Please check if the script is included.');
            }

            // Initialize if not already done
            if (!this.emailjsInitialized) {
                if (EMAIL_SERVICE_CONFIG.publicKey === 'YOUR_PUBLIC_KEY') {
                    throw new Error('EmailJS not configured. Please set up EMAIL_SERVICE_CONFIG in mango-mart.js');
                }
                emailjs.init(EMAIL_SERVICE_CONFIG.publicKey);
                this.emailjsInitialized = true;
            }

            // EmailJS template parameters
            // Note: Make sure your EmailJS template uses these variable names
            // Common variable names: to_email, user_email, reply_to, subject, message, from_name, email
            const templateParams = {
                email: toEmail,            // Recipient email (used by Password Reset template)
                to_email: toEmail,         // Recipient email
                user_email: toEmail,      // Alternative name some templates use
                reply_to: toEmail,        // Some services use this
                subject: subject,         // Email subject
                message: message,         // Email body/content
                from_name: 'Mango Mart',  // Sender name
                to_name: 'User'           // Recipient name (optional)
            };

            const response = await emailjs.send(
                EMAIL_SERVICE_CONFIG.serviceId,
                EMAIL_SERVICE_CONFIG.templateId,
                templateParams
            );

            return { success: true, response };
        } catch (error) {
            console.error('Email sending error:', error);
            throw new Error('Failed to send email: ' + (error.text || error.message));
        }
    },

    // Send SMS via TextLocal, MSG91, or other providers
    async sendSMS(toMobile, message) {
        try {
            // Check if SMS service is configured
            if (SMS_SERVICE_CONFIG.provider === 'none' || 
                (SMS_SERVICE_CONFIG.provider === 'textlocal' && SMS_SERVICE_CONFIG.textlocalApiKey === 'YOUR_TEXTLOCAL_API_KEY') ||
                (SMS_SERVICE_CONFIG.provider === 'msg91' && SMS_SERVICE_CONFIG.msg91AuthKey === 'YOUR_MSG91_AUTH_KEY')) {
                const error = new Error('SMS_SERVICE_NOT_CONFIGURED');
                error.configurable = true;
                throw error;
            }

            // Remove any spaces or special characters from mobile number
            const cleanMobile = toMobile.replace(/\D/g, '');
            
            // Ensure mobile number starts with country code (91 for India)
            const mobileWithCountryCode = cleanMobile.startsWith('91') ? cleanMobile : `91${cleanMobile}`;

            if (SMS_SERVICE_CONFIG.provider === 'textlocal') {
                // TextLocal API implementation
                const formData = new FormData();
                formData.append('apikey', SMS_SERVICE_CONFIG.textlocalApiKey);
                formData.append('numbers', mobileWithCountryCode);
                formData.append('message', message);
                formData.append('sender', SMS_SERVICE_CONFIG.senderId);

                const response = await fetch('https://api.textlocal.in/send/', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.status === 'success') {
                    return { success: true, result };
                } else {
                    throw new Error(result.message || 'SMS sending failed');
                }
            } else if (SMS_SERVICE_CONFIG.provider === 'msg91') {
                // MSG91 API implementation
                const response = await fetch('https://api.msg91.com/api/v5/flow/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'authkey': SMS_SERVICE_CONFIG.msg91AuthKey
                    },
                    body: JSON.stringify({
                        template_id: SMS_SERVICE_CONFIG.msg91TemplateId,
                        sender: SMS_SERVICE_CONFIG.senderId,
                        short_url: '0',
                        mobiles: mobileWithCountryCode,
                        message: message
                    })
                });

                const result = await response.json();
                
                if (result.type === 'success') {
                    return { success: true, result };
                } else {
                    throw new Error(result.message || 'SMS sending failed');
                }
            } else {
                throw new Error('SMS provider not supported. Please use "textlocal" or "msg91"');
            }
        } catch (error) {
            console.error('SMS sending error:', error);
            throw error;
        }
    },

    // Send password reset code
    async sendResetCode(email, code) {
        try {
            // Send via email
            const subject = 'Mango Mart - Password Reset Code';
            // Send only the code - let the template handle the formatting
            const message = `${code}`;
            
            await this.sendEmail(email, subject, message);
            return { method: 'email', success: true };
        } catch (error) {
            console.error('Failed to send reset code:', error);
            // If email fails and it's a config error, provide fallback
            if (error.message && error.message.includes('not configured')) {
                return { 
                    method: 'email', 
                    success: false, 
                    error: 'SERVICE_NOT_CONFIGURED',
                    fallbackCode: code 
                };
            }
            throw error;
        }
    }
};

const storage = {
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch {
            return null;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Storage error:', error);
        }
    },
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Storage error:', error);
        }
    }
};

const toast = {
    container: null,
    queue: [],
    current: null,
    timer: null,
    
    init() {
        if (!this.container) {
            this.container = document.getElementById('toast-container');
        }
    },
    
    buildToast(message, type = 'success') {
        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                   type === 'error' ? 'x-circle' : 
                   type === 'loading' ? 'loader' : 'info';
        
        toastEl.innerHTML = `
            <i data-lucide="${icon}" class="w-5 h-5 ${type === 'loading' ? 'animate-spin' : ''}"></i>
            <span>${message}</span>
        `;
        
        return toastEl;
    },

    enqueue(message, type, duration) {
        this.queue.push({ message, type, duration });
        this.processQueue();
    },

    processQueue() {
        if (this.current || this.queue.length === 0) {
            return;
        }

        const nextToast = this.queue.shift();
        this.displayToast(nextToast);
    },

    displayToast({ message, type, duration }) {
        this.init();
        const toastEl = this.buildToast(message, type);
        this.container.appendChild(toastEl);
        initIcons();

        this.current = { el: toastEl, type };
        
        if (duration > 0) {
            this.timer = setTimeout(() => {
                this.finishCurrent();
            }, duration);
        }
    },

    finishCurrent() {
        if (!this.current) {
            return;
        }

        const { el } = this.current;
        if (el && el.parentNode) {
            el.remove();
        }

        this.current = null;

        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        this.processQueue();
    },

    show(message, type = 'success', duration = 1000) {
        if (type === 'loading') {
            this.init();
            // Immediately show loading toast, replacing any current toast
            if (this.current && this.current.el) {
                this.finishCurrent();
            }
            this.queue = [];
            const toastEl = this.buildToast(message, type);
            this.container.appendChild(toastEl);
            initIcons();
            this.current = { el: toastEl, type };
        return toastEl;
        }

        this.enqueue(message, type, duration);
        return null;
    },
    
    success(message, duration = 1000) {
        return this.show(message, 'success', duration);
    },
    
    error(message, duration = 1000) {
        return this.show(message, 'error', duration);
    },
    
    loading(message) {
        return this.show(message, 'loading', 0);
    },
    
    dismiss(toastEl) {
        if (toastEl && toastEl.parentNode) {
            toastEl.remove();
        }

        if (this.current && this.current.el === toastEl) {
            this.current = null;
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.processQueue();
        }
    }
};

const offlineIndicator = {
    el: null,
    titleEl: null,
    subtitleEl: null,
    hideTimeout: null,

    init() {
        if (this.el) {
            return;
        }

        if (!document.body) {
            document.addEventListener('DOMContentLoaded', () => this.init(), { once: true });
            return;
        }

        const indicator = document.createElement('div');
        indicator.className = 'offline-indicator';
        indicator.setAttribute('role', 'status');
        indicator.setAttribute('aria-live', 'polite');
        indicator.innerHTML = `
            <div class="offline-indicator__icon" aria-hidden="true">
                <span class="offline-indicator__wave offline-indicator__wave--1"></span>
                <span class="offline-indicator__wave offline-indicator__wave--2"></span>
                <span class="offline-indicator__dot"></span>
            </div>
            <div class="offline-indicator__text">
                <p class="offline-indicator__title">You are offline</p>
                <p class="offline-indicator__subtitle">We're trying to reconnect...</p>
            </div>
        `;

        document.body.appendChild(indicator);
        this.el = indicator;
        this.titleEl = indicator.querySelector('.offline-indicator__title');
        this.subtitleEl = indicator.querySelector('.offline-indicator__subtitle');
    },

    setMessage(title, subtitle) {
        if (this.titleEl && typeof title === 'string') {
            this.titleEl.textContent = title;
        }
        if (this.subtitleEl && typeof subtitle === 'string') {
            this.subtitleEl.textContent = subtitle;
        }
    },

    showOffline() {
        this.init();
        this.setMessage("You are offline", "We're trying to reconnect...");
        if (this.el) {
            this.el.classList.remove('offline-indicator--success');
            this.el.classList.add('offline-indicator--visible');
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    },

    showOnline() {
        this.init();
        this.setMessage('Back online', 'Connection restored');
        if (this.el) {
            this.el.classList.add('offline-indicator--visible', 'offline-indicator--success');
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        this.hideTimeout = setTimeout(() => {
            this.hide();
        }, 2600);
    },

    hide() {
        if (this.el) {
            this.el.classList.remove('offline-indicator--visible');
            this.el.classList.remove('offline-indicator--success');
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }
};

function initNetworkStatusWatcher() {
    const handleOffline = () => offlineIndicator.showOffline();
    const handleOnline = () => offlineIndicator.showOnline();

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        // Delay slightly to avoid animation jump during initial render
        setTimeout(handleOffline, 120);
    }
}

initNetworkStatusWatcher();

function initIcons() {
    if (window.lucide) {
        try {
            window.lucide.createIcons();
            console.log('✅ Icons initialized successfully');
        } catch (error) {
            console.warn('⚠️ Icon initialization error:', error);
            fallbackIcons();
        }
    } else {
        // Retry if lucide hasn't loaded yet
        console.warn('⚠️ Lucide not yet loaded, retrying...');
        setTimeout(() => {
            if (window.lucide) {
                try {
                    window.lucide.createIcons();
                    console.log('✅ Icons initialized on retry');
                } catch (error) {
                    console.warn('⚠️ Icon initialization error on retry:', error);
                    fallbackIcons();
                }
            } else {
                console.error('❌ Lucide script failed to load');
                // Fallback: Use text-based icons
                fallbackIcons();
            }
        }, 100);
        // Also try fallback immediately
        setTimeout(() => {
            fallbackIcons();
        }, 200);
    }
}

function fallbackIcons() {
    console.log('🔄 Applying fallback icons...');
    // Replace Lucide icons with unicode symbols
    document.querySelectorAll('[data-lucide="menu"]').forEach(el => {
        el.textContent = '☰';
        el.style.fontSize = '24px';
    });
    document.querySelectorAll('[data-lucide="shopping-cart"]').forEach(el => {
        el.textContent = '🛒';
        el.style.fontSize = '24px';
    });
    document.querySelectorAll('[data-lucide="search"]').forEach(el => {
        el.textContent = '🔍';
        el.style.fontSize = '20px';
    });
    document.querySelectorAll('[data-lucide="x"]').forEach(el => {
        el.textContent = '✕';
        el.style.fontSize = '20px';
    });
    document.querySelectorAll('[data-lucide="shopping-bag"]').forEach(el => {
        el.textContent = '🛍️';
        el.style.fontSize = '32px';
    });
    document.querySelectorAll('[data-lucide="arrow-left"]').forEach(el => {
        el.textContent = '←';
        el.style.fontSize = '20px';
    });
    document.querySelectorAll('[data-lucide="package"]').forEach(el => {
        el.textContent = '📦';
        el.style.fontSize = '20px';
    });
    document.querySelectorAll('[data-lucide="user"]').forEach(el => {
        el.textContent = '👤';
        el.style.fontSize = '20px';
    });
    document.querySelectorAll('[data-lucide="info"]').forEach(el => {
        el.textContent = 'ℹ️';
        el.style.fontSize = '20px';
    });
    document.querySelectorAll('[data-lucide="phone"]').forEach(el => {
        el.textContent = '📞';
        el.style.fontSize = '20px';
    });
    document.querySelectorAll('[data-lucide="minus"]').forEach(el => {
        el.textContent = '-';
        el.style.fontSize = '18px';
    });
    document.querySelectorAll('[data-lucide="plus"]').forEach(el => {
        el.textContent = '+';
        el.style.fontSize = '18px';
    });
    console.log('✅ Fallback icons applied');
}

// Enable lazy loading for images without changing templates
function enableLazyImages() {
    const setLazy = (img) => {
        if (!img) return;
        if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
        if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
    };
    document.querySelectorAll('img').forEach(setLazy);
    const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
            m.addedNodes && m.addedNodes.forEach((n) => {
                if (n.nodeType === 1) {
                    if (n.tagName === 'IMG') setLazy(n);
                    n.querySelectorAll && n.querySelectorAll('img').forEach(setLazy);
                }
            });
        }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
}

// ===== Trending & Smart Search Suggestions =====
function getTrendingTerms() {
    return [];
}

function getRecentSearches() {
    try { return JSON.parse(localStorage.getItem('recentSearches') || '[]'); } catch { return []; }
}

function saveRecentSearch(query) {
    if (!query) return;
    const list = getRecentSearches().filter(q => q.toLowerCase() !== query.toLowerCase());
    list.unshift(query);
    const trimmed = list.slice(0, 8);
    localStorage.setItem('recentSearches', JSON.stringify(trimmed));
}
function attachTrendingToInput(input, onSelect) {
    if (!input || input.dataset.trendingAttached) return;
    input.dataset.trendingAttached = '1';

    const wrapper = input.closest('.search-input-wrapper') || input.parentElement;
    const panel = document.createElement('div');
    panel.style.position = 'absolute';
    panel.style.left = '0';
    panel.style.right = '0';
    panel.style.top = '100%';
    panel.style.marginTop = '6px';
    panel.style.background = '#fff';
    panel.style.border = '1px solid #e5e7eb';
    panel.style.borderRadius = '10px';
    panel.style.boxShadow = '0 10px 20px rgba(0,0,0,0.08)';
    panel.style.zIndex = '60';
    panel.style.padding = '4px';
    panel.style.maxHeight = '200px';
    panel.style.overflowY = 'auto';
    panel.style.display = 'none';
    panel.setAttribute('role', 'listbox');

    const renderList = (items, sectionTitle) => {
        if (!items || items.length === 0) return '';
        // Show only 3 items instead of 8 to minimize the panel
        const chips = items.slice(0, 3).map(t => `<button type="button" class="mm-chip" data-term="${t.replace(/"/g,'&quot;')}">${t}</button>`).join('');
        return `<div class="mm-sec"><div class="mm-title">${sectionTitle}</div><div class="mm-chips">${chips}</div></div>`;
    };

    const style = document.createElement('style');
    style.textContent = `
    .mm-sec{padding:4px}
    .mm-title{font-size:10px;color:#9ca3af;margin:2px 6px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px}
    .mm-chips{display:flex;flex-wrap:wrap;gap:4px;padding:2px 4px}
    .mm-chip{padding:4px 8px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:9999px;font-size:11px;color:#374151;cursor:pointer;line-height:1.2}
    .mm-chip:hover{background:#eef2ff;border-color:#c7d2fe;color:#4338ca}
    .mm-list{max-height:150px;overflow:auto}
    .mm-item{padding:6px 10px;cursor:pointer;border-radius:6px;font-size:12px}
    .mm-item:hover{background:#f9fafb}
    `;
    document.head.appendChild(style);

    const showPanel = () => { panel.style.display = 'block'; };
    const hidePanel = () => { panel.style.display = 'none'; };

    const build = (q) => {
        const recent = getRecentSearches();
        const trending = getTrendingTerms();
        let filtered = [];
        if (q && q.trim()) {
            const lower = q.toLowerCase();
            filtered = (mockProducts || []).filter(p => p.name.toLowerCase().includes(lower)).slice(0, 5).map(p => p.name);
        }
        // Only show suggestions if user is typing, minimize recent/trending when typing
        if (q && q.trim()) {
            // User is typing - show suggestions prominently, minimize recent/trending
            panel.innerHTML = `
                ${filtered.length ? `<div class="mm-sec"><div class="mm-title">Suggestions</div><div class="mm-list">${filtered.slice(0, 5).map(s => `<div class='mm-item' data-term='${s.replace(/"/g,'&quot;')}'>${s}</div>`).join('')}</div></div>` : ''}
                ${recent.length > 0 ? renderList(recent.slice(0, 2), 'Recent') : ''}
                ${trending.length > 0 ? renderList(trending.slice(0, 2), 'Trending') : ''}
            `;
        } else {
            // No query - show recent and trending minimized
            panel.innerHTML = `
                ${recent.length > 0 ? renderList(recent, 'Recent') : ''}
                ${trending.length > 0 ? renderList(trending, 'Trending') : ''}
            `;
        }
        panel.querySelectorAll('[data-term]').forEach(el => {
            el.addEventListener('click', () => {
                const term = el.getAttribute('data-term');
                input.value = term;
                hidePanel();
                onSelect && onSelect(term);
            });
        });
    };

    build('');
    wrapper.style.position = wrapper.style.position || 'relative';
    wrapper.appendChild(panel);

    input.addEventListener('focus', () => { build(input.value); showPanel(); });
    input.addEventListener('input', () => { build(input.value); showPanel(); });
    input.addEventListener('blur', () => setTimeout(hidePanel, 150));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { hidePanel(); }
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusClass(status) {
    const statusMap = {
        'pending': 'status-pending',
        'confirmed': 'status-confirmed',
        'picked-up': 'status-picked-up',
        'out-for-delivery': 'status-out-for-delivery',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showLoading() {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <div class="spinner mx-auto mb-4"></div>
                    <p class="text-gray-600">Loading Mango Mart...</p>
                </div>
            </div>
        `;
    }
}
// ===== SAMPLE DATA =====
const sampleProducts = [
    {
        id: 'prod-1',
        name: 'Fresh Mangoes',
        description: 'Sweet and juicy mangoes from the finest orchards',
        price: 120,
        category: 'fruits',
        image: 'https://images.unsplash.com/photo-1605027990121-75fd594d6565?w=400',
        stock: 50,
        status: 'in_stock',
        rating: 4.8,
        reviews: 124
    },
    {
        id: 'prod-2',
        name: 'Organic Bananas',
        description: 'Premium organic bananas, perfect for smoothies',
        price: 60,
        category: 'fruits',
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
        stock: 75,
        status: 'in_stock',
        rating: 4.6,
        reviews: 89
    },
    {
        id: 'prod-3',
        name: 'Fresh Strawberries',
        description: 'Sweet and fresh strawberries, perfect for desserts',
        price: 150,
        category: 'fruits',
        image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400',
        stock: 30,
        status: 'in_stock',
        rating: 4.9,
        reviews: 156
    },
    {
        id: 'prod-4',
        name: 'Organic Spinach',
        description: 'Fresh organic spinach leaves, packed with nutrients',
        price: 80,
        category: 'vegetables',
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
        stock: 40,
        status: 'in_stock',
        rating: 4.7,
        reviews: 67
    },
    {
        id: 'prod-5',
        name: 'Fresh Carrots',
        description: 'Crisp and sweet carrots, great for cooking',
        price: 40,
        category: 'vegetables',
        image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
        stock: 60,
        status: 'in_stock',
        rating: 4.5,
        reviews: 92
    },
    {
        id: 'prod-6',
        name: 'Organic Tomatoes',
        description: 'Juicy organic tomatoes, perfect for salads',
        price: 90,
        category: 'vegetables',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
        stock: 35,
        status: 'in_stock',
        rating: 4.8,
        reviews: 78
    },
    {
        id: 'prod-7',
        name: 'Blue Ink Pen',
        description: 'Smooth writing ballpoint pen with blue ink',
        price: 25,
        category: 'stationary',
        image: 'https://images.unsplash.com/photo-1583484967954-6fbd0b2a8b8c?w=400',
        stock: 100,
        status: 'in_stock',
        rating: 4.5,
        reviews: 45
    },
    {
        id: 'prod-8',
        name: 'A4 Notebook',
        description: '200 pages ruled notebook for school and office',
        price: 150,
        category: 'stationary',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
        stock: 50,
        status: 'in_stock',
        rating: 4.7,
        reviews: 89
    },
    {
        id: 'prod-9',
        name: 'Pencil Set',
        description: 'Set of 12 HB pencils with eraser',
        price: 80,
        category: 'stationary',
        image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
        stock: 75,
        status: 'in_stock',
        rating: 4.6,
        reviews: 67
    },
    {
        id: 'prod-10',
        name: 'Stapler',
        description: 'Heavy duty stapler with 1000 staples',
        price: 200,
        category: 'stationary',
        image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400',
        stock: 30,
        status: 'in_stock',
        rating: 4.8,
        reviews: 34
    },
    {
        id: 'prod-11',
        name: 'Highlighter Set',
        description: 'Set of 6 colorful highlighters',
        price: 120,
        category: 'stationary',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        stock: 40,
        status: 'in_stock',
        rating: 4.4,
        reviews: 56
    }
];

let mainCategories = [
    { 
        id: 'fruits-vegetables', 
        name: 'Fruits & Vegetables', 
        icon: 'apple', 
        color: 'from-emerald-500 via-green-500 to-teal-600',
        description: 'Fresh organic produce',
        subcategories: ['fruits', 'vegetables']
    },
    { 
        id: 'grocery', 
        name: 'Grocery', 
        icon: 'shopping-bag', 
        color: 'from-amber-500 via-orange-500 to-red-500',
        description: 'Daily essentials & pantry items',
        subcategories: ['dairy', 'bakery', 'pantry', 'snacks', 'cleaning-agents']
    },
    { 
        id: 'stationary', 
        name: 'Stationary', 
        icon: 'pen-tool', 
        color: 'from-indigo-500 via-purple-500 to-pink-500',
        description: 'Office & school supplies',
        subcategories: ['stationary']
    }
];

const sampleCategories = [
    { id: 'fruits', name: 'Fruits', icon: 'apple' },
    { id: 'vegetables', name: 'Vegetables', icon: 'carrot' },
    { id: 'dairy', name: 'Dairy', icon: 'milk' },
    { id: 'bakery', name: 'Bakery', icon: 'bread' },
    { id: 'pantry', name: 'Pantry', icon: 'package' },
    { id: 'snacks', name: 'Snacks', icon: 'cookie' },
    { id: 'cleaning-agents', name: 'Cleaning Agents', icon: 'sparkles' },
    { id: 'stationary', name: 'Stationary', icon: 'pen-tool' }
];

// ===== MOCK DATA STORAGE =====
let mockProducts = [...sampleProducts];
let mockOrders = [];
let mockAgents = [];

// ===== RAZORPAY CONFIGURATION =====
const RAZORPAY_KEY_ID = 'rzp_live_Rdggh00S9sNFNg';
const RAZORPAY_CONFIG = {
    key: RAZORPAY_KEY_ID,
    currency: 'INR',
    name: 'Mango Mart',
    description: 'Fresh Groceries & More',
    image: 'https://images.unsplash.com/photo-1605027990121-75fd594d6565?w=100',
    theme: {
        color: '#10B981'
    }
};

// Check if Razorpay is loaded
function checkRazorpayAvailability() {
    if (typeof Razorpay === 'undefined') {
        return false;
    }
    return true;
}

// Initialize Razorpay check on page load (silent check)
document.addEventListener('DOMContentLoaded', () => {
    // Check after a delay, but don't show warnings unless actually needed
    setTimeout(() => {
        checkRazorpayAvailability();
        // Only log if we're actually trying to use payment
    }, 3000);
});

// ===== SUPABASE DATABASE =====
// Supabase configuration
const SUPABASE_URL = 'https://nruafgayqspvluubsvwb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydWFmZ2F5cXNwdmx1dWJzdndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODI1MTcsImV4cCI6MjA3NjQ1ODUxN30.hhnZq-mF24RYW9SfnorFNw-Wl51bK_mfDjQiN2WCNcA';

// Initialize Supabase client
let supabase;
let supabaseReady = false;
// Cart operations now use Supabase only - no localStorage fallbacks

async function initSupabase() {
    // Prevent multiple initializations
    if (supabase && supabaseReady) {
        return Promise.resolve(true);
    }
    
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds total (50 * 100ms)
        
        const checkSupabase = () => {
            attempts++;
            if (window.supabase && window.supabase.createClient) {
                try {
                    // Only create client if it doesn't exist
                    if (!supabase) {
                        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                            auth: {
                                persistSession: false,
                                storageKey: 'mango-mart-auth' // Unique storage key to avoid conflicts
                            }
                        });
                        supabaseReady = true;
                        console.log('✅ Supabase client initialized successfully');
                    } else {
                        supabaseReady = true;
                    }
                    resolve(true);
                } catch (error) {
                    console.error('❌ Error initializing Supabase:', error);
                    supabaseReady = false;
                    resolve(false);
                }
            } else if (attempts < maxAttempts) {
                setTimeout(checkSupabase, 100);
            } else {
                console.error('❌ Supabase failed to load after 5 seconds');
                supabaseReady = false;
                resolve(false);
            }
        };
        
        checkSupabase();
    });
}

// Don't load script again if it's already in HTML
if (typeof window !== 'undefined' && !window.supabase) {
    // Load Supabase script if not already loaded
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@supabase/supabase-js@2';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onerror = () => {
        console.error('❌ Failed to load Supabase script from CDN');
        console.warn('⚠️ Make sure you have internet connection or Supabase script is loaded in HTML');
    };
    script.onload = () => {
        console.log('✅ Supabase script loaded successfully');
    };
    document.head.appendChild(script);
}

// Debug function to check Supabase status
function debugSupabaseStatus() {
    console.log('Supabase Status:', {
        supabase: !!supabase,
        supabaseReady: supabaseReady,
        windowSupabase: !!window.supabase
    });
}
// Database service functions
const db = {
    // Users
    async createUser(userData) {
        console.log('Creating user with data:', userData);
        debugSupabaseStatus();
        
        // Wait for Supabase to be ready
        if (!supabaseReady) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        if (!supabase) {
            // Fallback to localStorage
            const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const newUser = { ...userData, id: 'user_' + Date.now() };
            existingUsers.push(newUser);
            localStorage.setItem('users', JSON.stringify(existingUsers));
            console.log('User created in localStorage:', newUser);
            return { data: newUser, error: null };
        }
        
        try {
            console.log('Attempting to create user in Supabase...');
            // Clean user data to match database schema
            const cleanUserData = {
                name: userData.name,
                email: userData.email || null,
                mobile: userData.mobile || null,
                password: userData.password,
                role: userData.role || 'customer'
            };
            
            const { data, error } = await supabase
                .from('users')
                .insert([cleanUserData])
                .select()
                .single();
            
            if (error) {
                console.error('Supabase createUser error:', error);
                // Fallback to localStorage
                const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
                const newUser = { ...userData, id: 'user_' + Date.now() };
                existingUsers.push(newUser);
                localStorage.setItem('users', JSON.stringify(existingUsers));
                console.log('User created in localStorage (fallback):', newUser);
                return { data: newUser, error: null };
            }
            
            console.log('User created in Supabase:', data);
            return { data, error };
        } catch (err) {
            console.error('Supabase createUser exception:', err);
            // Fallback to localStorage
            const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const newUser = { ...userData, id: 'user_' + Date.now() };
            existingUsers.push(newUser);
            localStorage.setItem('users', JSON.stringify(existingUsers));
            console.log('User created in localStorage (fallback):', newUser);
            return { data: newUser, error: null };
        }
    },

    async getUserById(id) {
        if (!supabase) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.id === id);
            return { data: user, error: null };
        }
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    },

    async getUserByEmail(email) {
        // Wait for Supabase to be ready
        if (!supabaseReady) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        if (!supabase) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email);
            return { data: user, error: null };
        }
        
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .maybeSingle();
            
            if (error) {
                // Check for 406 (Not Acceptable) - table might not exist or RLS blocking
                if (error.message?.includes('406') || error.status === 406 || error.statusCode === 406 || 
                    (error.code && error.code.toString().includes('406'))) {
                // Fallback to localStorage
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => u.email === email);
                    return { data: user, error: null };
                }
                // Fallback to localStorage for other errors
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => u.email === email);
                return { data: user, error: null };
            }
            
            return { data, error };
        } catch (err) {
            // Fallback to localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email);
            return { data: user, error: null };
        }
    },

    async getUserByMobile(mobile) {
        // Wait for Supabase to be ready
        if (!supabaseReady) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        if (!supabase) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.mobile === mobile);
            return { data: user, error: null };
        }
        
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('mobile', mobile)
                .maybeSingle();
            
            if (error) {
                // Check for 406 (Not Acceptable) - table might not exist or RLS blocking
                if (error.message?.includes('406') || error.status === 406 || error.statusCode === 406 || 
                    (error.code && error.code.toString().includes('406'))) {
                // Fallback to localStorage
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => u.mobile === mobile);
                    return { data: user, error: null };
                }
                // Fallback to localStorage for other errors
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => u.mobile === mobile);
                return { data: user, error: null };
            }
            
            return { data, error };
        } catch (err) {
            // Fallback to localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.mobile === mobile);
            return { data: user, error: null };
        }
    },

    async updateUserPassword(userId, newPassword) {
        if (!supabase) {
            // Update in localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                return { data: null, error: { message: 'User not found' } };
            }
            users[userIndex].password = newPassword;
            localStorage.setItem('users', JSON.stringify(users));
            return { data: users[userIndex], error: null };
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .update({ password: newPassword })
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                // Check for 406 (Not Acceptable) - table might not exist or RLS blocking
                if (error.message?.includes('406') || error.status === 406 || error.statusCode === 406 || 
                    (error.code && error.code.toString().includes('406'))) {
                    // Fallback to localStorage
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const userIndex = users.findIndex(u => u.id === userId);
                    if (userIndex !== -1) {
                        users[userIndex].password = newPassword;
                        localStorage.setItem('users', JSON.stringify(users));
                        return { data: users[userIndex], error: null };
                    }
                    return { data: null, error };
                }
                // Fallback to localStorage for other errors
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const userIndex = users.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    users[userIndex].password = newPassword;
                    localStorage.setItem('users', JSON.stringify(users));
                    return { data: users[userIndex], error: null };
                }
                return { data: null, error };
            }

            return { data, error };
        } catch (err) {
            // Fallback to localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex].password = newPassword;
                localStorage.setItem('users', JSON.stringify(users));
                return { data: users[userIndex], error: null };
            }
            return { data: null, error: err };
        }
    },

    // Orders
    async createOrder(orderData) {
        console.log('=== DB.CREATEORDER ===');
        console.log('Supabase available:', !!supabase);
        console.log('Order data to insert:', orderData);
        
        if (!supabase) {
            console.log('Supabase not available, using localStorage fallback');
            const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            existingOrders.push(orderData);
            localStorage.setItem('orders', JSON.stringify(existingOrders));
            return { data: orderData, error: null };
        }
        
        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single();
            
            console.log('Supabase insert result:', { data, error });
            return { data, error };
        } catch (err) {
            console.error('Supabase insert error:', err);
            return { data: null, error: err };
        }
    },

    async getUserOrders(userId, userEmail) {
        if (!supabase) {
            const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            const userOrders = allOrders.filter(order => 
                order.customerId === userId || 
                order.customerEmail === userEmail ||
                order.customerMobile === userEmail
            );
            return { data: userOrders, error: null };
        }
        
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .or(`customerId.eq.${userId},customerEmail.eq.${userEmail},customerMobile.eq.${userEmail}`)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    // User Cart Management - Supabase only, no localStorage
    async getUserCart(userId) {
        if (!supabase || !userId) {
            return { data: [], error: { message: 'Supabase not available or no user ID' } };
        }
        
        // Validate that userId is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(String(userId).trim())) {
            console.warn('Skipping cart query: Invalid user ID format:', userId);
            return { data: [], error: { message: 'Invalid user ID format' } };
        }
        
        try {
            const { data, error } = await supabase
                .from('user_carts')
                .select('*')
                .eq('user_id', userId);
            
            if (error) {
                // Check for 406 (Not Acceptable) - table might not exist or RLS blocking
                // Note: PGRST116 is "no rows found" which is OK, not an error
                if (error.message?.includes('406') || error.status === 406 || error.statusCode === 406 || 
                    (error.code && error.code.toString().includes('406'))) {
                    console.error('⚠️ user_carts table not accessible (406 error). Please run create_user_carts_table.sql in Supabase SQL Editor.');
                    console.error('Error details:', error);
                    return { 
                        data: [], 
                        error: { 
                            ...error,
                            message: 'Cart table not accessible. Please run create_user_carts_table.sql in Supabase SQL Editor.',
                            isTableError: true
                        } 
                    };
                }
                console.error('Error fetching user cart from Supabase:', error);
                return { data: [], error };
            }
            
            return { data: data || [], error: null };
        } catch (err) {
            console.error('Exception fetching user cart:', err);
            return { data: [], error: err };
        }
    },

    async addToUserCart(userId, product) {
        return this.upsertUserCartItem(userId, product.id, {
            product_name: String(product.name || 'Unknown Product'),
            product_price: parseFloat(product.price || 0),
            product_image: String(product.image || ''),
            quantity: parseInt(product.quantity, 10) || 1
        });
    },

    async updateUserCartItem(userId, productId, quantity) {
        if (quantity <= 0) {
            return this.deleteUserCartItem(userId, productId);
        }
        return this.upsertUserCartItem(userId, productId, { quantity });
    },

    async upsertUserCartItem(userId, productId, fields) {
        if (!supabase || !userId) {
            return { data: null, error: { message: 'Supabase not available or no user ID' } };
        }
        
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(String(userId).trim())) {
            console.warn('Skipping cart operation: Invalid user ID format:', userId);
            return { data: null, error: { message: 'Invalid user ID format' } };
        }
        
        try {
            const trimmedUserId = String(userId).trim();
            const trimmedProductId = String(productId);
            const timestamp = new Date().toISOString();

            // If we only need to update existing row fields (e.g., quantity), use UPDATE to avoid not-null constraint issues
            const requiresFullPayload = fields.product_name !== undefined || fields.product_price !== undefined || fields.product_image !== undefined;

            if (!requiresFullPayload) {
                const { data, error } = await supabase
                .from('user_carts')
                    .update({
                        ...fields,
                        updated_at: timestamp
                    })
                    .eq('user_id', trimmedUserId)
                    .eq('product_id', trimmedProductId)
                .select('*')
                    .single();

                if (error) {
                    console.error('Error updating cart item:', error);
                    return { data: null, error };
                }

                // If no row was updated (item missing), fall back to full upsert with required product data
                if (!data) {
                    console.warn('Cart item missing during update, falling back to upsert with full payload');
                } else {
                    return { data, error: null };
                }
            }

            const payload = {
                user_id: trimmedUserId,
                product_id: trimmedProductId,
                updated_at: timestamp,
                product_name: String(fields.product_name || 'Unknown Product'),
                product_price: parseFloat(fields.product_price ?? 0),
                product_image: String(fields.product_image || ''),
                quantity: parseInt(fields.quantity, 10) || 1
                };
                
                const { data, error } = await supabase
                    .from('user_carts')
                .upsert([payload], { onConflict: 'user_id,product_id' })
                            .select('*')
                .single();

            if (error) {
                console.error('Error saving cart item:', error);
                            return { data: null, error };
            }

            return { data, error: null };
        } catch (err) {
            console.error('Exception saving cart item:', err);
            return { data: null, error: err };
        }
    },

    async deleteUserCartItem(userId, productId) {
        if (!supabase || !userId) {
            return { data: null, error: { message: 'Supabase not available or no user ID' } };
        }
        
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(String(userId).trim())) {
            console.warn('Skipping cart operation: Invalid user ID format:', userId);
            return { data: null, error: { message: 'Invalid user ID format' } };
        }
        
            try {
                    const { error } = await supabase
                        .from('user_carts')
                        .delete()
                .eq('user_id', String(userId).trim())
                .eq('product_id', String(productId));
                
                if (error) {
                    console.error('Error deleting cart item:', error);
                    return { data: null, error };
            }

            return { data: null, error: null };
        } catch (err) {
            console.error('Exception deleting cart item:', err);
            return { data: null, error: err };
        }
    },

    async clearUserCart(userId) {
        if (!supabase || !userId) {
            return { data: [], error: null };
        }
        
        // Validate that userId is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(String(userId).trim())) {
            console.warn('Skipping cart operation: Invalid user ID format:', userId);
            return { data: [], error: null }; // Skip cart operations for invalid user IDs
        }
        
        try {
            const { error } = await supabase
                .from('user_carts')
                .delete()
                .eq('user_id', userId);
            return { data: [], error };
        } catch (err) {
            console.error('Exception clearing cart:', err);
            return { data: [], error: null };
        }
    },

    // User Profile Management
    async getUserProfile(userId) {
        if (!supabase) {
            const profile = JSON.parse(localStorage.getItem(`profile_${userId}`) || '{}');
            return { data: profile, error: null };
        }
        
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
        return { data, error };
    },

    async updateUserProfile(userId, profileData) {
        if (!supabase) {
            localStorage.setItem(`profile_${userId}`, JSON.stringify(profileData));
            return { data: profileData, error: null };
        }
        
        const { data, error } = await supabase
            .from('user_profiles')
            .upsert({
                user_id: userId,
                ...profileData
            })
            .select()
            .single();
        return { data, error };
    },

    // Categories Management
    async getCategories() {
        if (!supabase) {
            return { data: sampleCategories, error: null };
        }
        
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: false });
        return { data, error };
    },

    async createCategory(categoryData) {
        if (!supabase) {
            const newCategory = { ...categoryData, id: 'cat_' + Date.now() };
            sampleCategories.push(newCategory);
            return { data: newCategory, error: null };
        }
        
        const { data, error } = await supabase
            .from('categories')
            .insert([categoryData])
            .select()
            .single();
        return { data, error };
    },

    async updateOrderStatus(orderId, status) {
        if (!supabase) {
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            const orderIndex = orders.findIndex(order => order.id === orderId);
            if (orderIndex !== -1) {
                orders[orderIndex].status = status;
                localStorage.setItem('orders', JSON.stringify(orders));
            }
            return { data: orders[orderIndex], error: null };
        }
        
        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)
            .select()
            .single();
        return { data, error };
    },

    // Products
    async getProducts() {
        if (!supabase) {
            return { data: mockProducts, error: null };
        }
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'active')
            .order('createdAt', { ascending: false });
        return { data, error };
    },

    async createProduct(productData) {
        if (!supabase) {
            const newProduct = { ...productData, id: 'prod_' + Date.now() };
            mockProducts.push(newProduct);
            return { data: newProduct, error: null };
        }
        
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();
        return { data, error };
    },

    async updateProduct(id, productData) {
        if (!supabase) {
            const productIndex = mockProducts.findIndex(p => p.id === id);
            if (productIndex !== -1) {
                mockProducts[productIndex] = { ...mockProducts[productIndex], ...productData };
            }
            return { data: mockProducts[productIndex], error: null };
        }
        
        const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    }
};

// ===== API CLIENT =====
// Sync existing mockOrders to localStorage on startup
function syncMockOrdersToLocalStorage() {
    const localStorageOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const mockOrderIds = mockOrders.map(order => order.id);
    const newMockOrders = mockOrders.filter(order => 
        !localStorageOrders.some(localOrder => localOrder.id === order.id)
    );
    
    if (newMockOrders.length > 0) {
        const updatedOrders = [...localStorageOrders, ...newMockOrders];
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        console.log(`Synced ${newMockOrders.length} mock orders to localStorage`);
    }
}
// Initialize sync on page load
syncMockOrdersToLocalStorage();

async function apiCall(endpoint, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const method = options.method || 'GET';
    
    try {
        if (endpoint === '/products' && method === 'GET') {
            return { products: mockProducts };
        }
        
        if (endpoint.startsWith('/products/') && method === 'GET') {
            const id = endpoint.split('/')[2];
            const product = mockProducts.find(p => p.id === id);
            if (!product) throw new Error('Product not found');
            return { product };
        }
        
        if (endpoint === '/products' && method === 'POST') {
            const product = { ...JSON.parse(options.body), id: `prod-${Date.now()}` };
            mockProducts.push(product);
            return { product };
        }
        
        if (endpoint.startsWith('/products/') && method === 'PUT') {
            const id = endpoint.split('/')[2];
            const index = mockProducts.findIndex(p => p.id === id);
            if (index === -1) throw new Error('Product not found');
            mockProducts[index] = { ...mockProducts[index], ...JSON.parse(options.body) };
            return { product: mockProducts[index] };
        }
        
        if (endpoint.startsWith('/products/') && method === 'DELETE') {
            const id = endpoint.split('/')[2];
            const index = mockProducts.findIndex(p => p.id === id);
            if (index === -1) throw new Error('Product not found');
            mockProducts.splice(index, 1);
            return { success: true };
        }
        
        if (endpoint === '/orders' && method === 'GET') {
            // Read from localStorage to get all orders (both API and Razorpay)
            const localStorageOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            const allOrders = [...mockOrders, ...localStorageOrders];
            return { orders: allOrders };
        }
        
        if (endpoint === '/orders' && method === 'POST') {
            const order = { ...JSON.parse(options.body), id: `order-${Date.now()}` };
            mockOrders.push(order);
            
            // Also save to localStorage for consistency
            const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            existingOrders.push(order);
            localStorage.setItem('orders', JSON.stringify(existingOrders));
            
            // Dispatch custom event for order creation
            window.dispatchEvent(new CustomEvent('orderCreated', { detail: order }));
            
            return { order };
        }
        
        if (endpoint.startsWith('/orders/') && endpoint.endsWith('/status') && method === 'PUT') {
            const id = endpoint.split('/')[2];
            const order = mockOrders.find(o => o.id === id);
            if (!order) throw new Error('Order not found');
            order.status = JSON.parse(options.body).status;
            return { order };
        }
        
        if (endpoint === '/agents' && method === 'GET') {
            return { agents: mockAgents };
        }
        
        if (endpoint === '/agents' && method === 'POST') {
            const agent = { ...JSON.parse(options.body), id: `agent-${Date.now()}` };
            mockAgents.push(agent);
            return { agent };
        }
        
        throw new Error('Endpoint not found');
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

const api = {
    async getProducts() {
        return await apiCall('/products', { method: 'GET' });
    },
    async createProduct(product, token) {
        return await apiCall('/products', {
            method: 'POST',
            body: JSON.stringify(product)
        });
    },
    async updateProduct(id, product, token) {
        return await apiCall(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product)
        });
    },
    async deleteProduct(id, token) {
        return await apiCall(`/products/${id}`, { method: 'DELETE' });
    },
    async getOrders(token) {
        return await apiCall('/orders', { method: 'GET' });
    },
    async createOrder(order, token) {
        return await apiCall('/orders', {
            method: 'POST',
            body: JSON.stringify(order)
        });
    },
    async updateOrderStatus(id, status, token) {
        return await apiCall(`/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },
    async getAgents(token) {
        return await apiCall('/agents', { method: 'GET' });
    },
    async createAgent(agent, token) {
        return await apiCall('/agents', {
            method: 'POST',
            body: JSON.stringify(agent)
        });
    }
};
// ===== AUTHENTICATION =====
class AuthManager {
    constructor() {
        this.session = null;
        this.user = null;
        this.onAuthChange = null;
    }

    async init(onAuthChange) {
        // Skip initialization on orders page
        if (window.ORDERS_PAGE) {
            console.log('Skipping AuthManager initialization on orders page');
            return;
        }
        
        this.onAuthChange = onAuthChange;
        
        try {
            const session = storage.get('session');
            if (session) {
                this.session = session;
                this.user = session.user;
                if (this.onAuthChange) {
                    this.onAuthChange(true, session.user.role || 'customer');
                }
            } else {
                this.renderAuthPage();
            }
        } catch (error) {
            console.error('Session check error:', error);
            this.renderAuthPage();
        }
    }

    // Register new user
    async register(userData) {
        const { name, email, password } = userData;
        
        // Validate required fields
        if (!name || !email || !password) {
            throw new Error('Name, email, and password are required');
        }

        // Validate email format
        if (!isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        // Check if user already exists
            const { data: existingUser } = await db.getUserByEmail(email);
        if (existingUser) {
            throw new Error('Email already registered! Please login instead.');
        }

        // Create new user
        // Check if this is an admin email
        const isAdminEmail = email === 'varunraj173205@gmail.com';
        
        const newUser = {
            name,
            email: email,
            mobile: '', // Keep mobile field empty
            password: this.hashPassword(password),
            role: isAdminEmail ? 'admin' : 'customer',
            createdAt: new Date().toISOString()
        };
        
        console.log('Creating user with role:', newUser.role);

        // Save user to database
        const { data, error } = await db.createUser(newUser);
        if (error) {
            throw new Error('Failed to create user: ' + error.message);
        }

        // Auto-login after registration
        this.login(email, password);
        
        return data;
    }

    // Login user with email
    async login(email, password) {
        let user = null;
        
        // First check if it's a delivery agent
        const deliveryAgent = await this.checkDeliveryAgent(email, password);
        if (deliveryAgent) {
            return this.session;
        }
        
        // Validate email format
        if (!isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        // Find user by email
        const { data } = await db.getUserByEmail(email);
        user = data;

        if (!user) {
            throw new Error('User not found');
        }

        if (!this.verifyPassword(password, user.password)) {
            throw new Error('Invalid password');
        }

        // Create session
        this.session = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role || 'customer'
            },
            token: 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            loginTime: new Date().toISOString()
        };
        
        console.log('User logged in with role:', user.role);
        console.log('Session user role:', this.session.user.role);

        this.saveSession();
        return this.session;
    }

    // Check if identifier is a delivery agent
    async checkDeliveryAgent(identifier, password) {
        try {
            console.log('Checking delivery agent:', identifier);
            if (!supabase || !supabaseReady) {
                console.log('Supabase not ready');
                return null;
            }

            // Try to find delivery agent by agent_id, email, or mobile
            let query = supabase
                .from('delivery_agents')
                .select('*')
                .eq('status', 'active');
            
            // Check if identifier is email or mobile, otherwise treat as agent_id
            if (isValidEmail(identifier)) {
                console.log('Looking up by email:', identifier);
                query = query.eq('email', identifier);
            } else if (identifier.match(/^\d{10}$/)) {
                console.log('Looking up by mobile:', identifier);
                query = query.eq('mobile', identifier);
            } else {
                console.log('Looking up by agent_id:', identifier);
                query = query.eq('agent_id', identifier);
            }
            
            const { data: agent, error } = await query.single();
            console.log('Delivery agent query result:', { agent, error });
            
            if (error || !agent) {
                return null;
            }
            
            // Verify password
            if (agent.password !== btoa(password + 'mango_mart_salt')) {
                return null;
            }
            
            // Create delivery agent session
            this.session = {
                user: {
                    id: agent.id,
                    name: agent.name,
                    email: agent.email,
                    mobile: agent.mobile,
                    role: 'delivery',
                    agent_id: agent.agent_id
                },
                token: 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                loginTime: new Date().toISOString()
            };
            
            console.log('Delivery agent logged in:', this.session.user);
            this.saveSession();
            console.log('Delivery agent session saved');
            return this.session;
            
        } catch (error) {
            console.error('Delivery agent check error:', error);
            return null;
        }
    }

    saveSession() {
        if (this.session) {
            storage.set('session', this.session);
            this.user = this.session.user;
        }
    }

    // Hash password (simple hash for demo)
    hashPassword(password) {
        return btoa(password + 'mango_mart_salt');
    }

    // Verify password
    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }

    // Generate 6-digit reset code
    generateResetCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Request password reset
    async requestPasswordReset(email) {
        // Validate email format
        if (!isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        // Find user by email
        const { data } = await db.getUserByEmail(email);
        const user = data;

        if (!user) {
            throw new Error('User not found. Please check your email and try again.');
        }

        // Generate reset code
        const resetCode = this.generateResetCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

        // Store reset token in localStorage
        const resetTokens = JSON.parse(localStorage.getItem('password_reset_tokens') || '{}');
        resetTokens[email] = {
            code: resetCode,
            expiresAt: expiresAt.toISOString(),
            userId: user.id
        };
        localStorage.setItem('password_reset_tokens', JSON.stringify(resetTokens));

        // Send code via email
        try {
            const sendResult = await notificationService.sendResetCode(email, resetCode);
            
            // Check if sending was successful
            if (sendResult.success) {
                return { 
                    code: resetCode, 
                    expiresAt,
                    sentVia: 'email',
                    message: 'Reset code has been sent to your email address. Please check your inbox.'
                };
            } else {
                // Service not configured - provide fallback
                return { 
                    code: resetCode, 
                    expiresAt,
                    sentVia: 'not_configured',
                    error: sendResult.error,
                    fallbackCode: sendResult.fallbackCode || resetCode,
                    message: 'Email service not configured. Please check the code below or configure EmailJS.'
                };
            }
        } catch (error) {
            // If sending fails completely, provide fallback for development
            console.warn('Failed to send reset code via email:', error);
            return { 
                code: resetCode, 
                expiresAt,
                sentVia: 'error',
                error: error.message,
                fallbackCode: resetCode,
                message: 'Failed to send email. Service may not be configured.'
            };
        }
    }

    // Verify reset code
    verifyResetCode(identifier, code) {
        const resetTokens = JSON.parse(localStorage.getItem('password_reset_tokens') || '{}');
        const tokenData = resetTokens[identifier];

        if (!tokenData) {
            throw new Error('No reset code found. Please request a new code.');
        }

        // Check if code matches
        if (tokenData.code !== code) {
            throw new Error('Invalid reset code. Please check and try again.');
        }

        // Check if expired
        const expiresAt = new Date(tokenData.expiresAt);
        if (new Date() > expiresAt) {
            delete resetTokens[identifier];
            localStorage.setItem('password_reset_tokens', JSON.stringify(resetTokens));
            throw new Error('Reset code has expired. Please request a new code.');
        }

        return true;
    }

    // Reset password
    async resetPassword(email, code, newPassword) {
        // Verify code first
        this.verifyResetCode(email, code);

        // Validate email format
        if (!isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        // Find user by email
        const { data: userData } = await db.getUserByEmail(email);
        const user = userData;

        if (!user) {
            throw new Error('User not found.');
        }

        // Update password
        const hashedPassword = this.hashPassword(newPassword);
        const { data: updateData, error } = await db.updateUserPassword(user.id, hashedPassword);

        if (error) {
            throw new Error('Failed to reset password: ' + error.message);
        }

        // Remove used reset token
        const resetTokens = JSON.parse(localStorage.getItem('password_reset_tokens') || '{}');
        delete resetTokens[email];
        localStorage.setItem('password_reset_tokens', JSON.stringify(resetTokens));

        return { success: true };
    }

    // Get user's orders only
    async getUserOrders() {
        if (!this.session) return [];
        
        const { data, error } = await db.getUserOrders(this.session.user.id, this.session.user.email);
        if (error) {
            console.error('Error fetching user orders:', error);
            return [];
        }
        return data || [];
    }

    // Save order for current user
    async saveUserOrder(orderData) {
        console.log('=== SAVING USER ORDER ===');
        console.log('Session:', this.session);
        console.log('Order data:', orderData);
        
        if (!this.session) {
            throw new Error('User not logged in');
        }

        const userOrder = {
            id: orderData.id,
            customer_id: this.session.user.id,
            customer_name: this.session.user.name,
            customer_email: this.session.user.email,
            customer_mobile: this.session.user.mobile,
            customer_address: orderData.customerAddress,
            customer_landmark: orderData.customerLandmark,
            customer_pincode: orderData.customerPincode,
            items: orderData.items,
            total_amount: orderData.totalAmount,
            status: orderData.status,
            payment_status: orderData.paymentStatus,
            payment_id: orderData.paymentId,
            payment_signature: orderData.paymentSignature,
            razorpay_order_id: orderData.razorpayOrderId,
            created_at: orderData.createdAt,
            paid_at: orderData.paidAt
        };

        console.log('User order to save:', userOrder);
        console.log('Supabase status:', { supabase: !!supabase, supabaseReady });

        const { data, error } = await db.createOrder(userOrder);
        console.log('Create order result:', { data, error });
        
        if (error) {
            console.error('Failed to save order to Supabase:', error);
            throw new Error('Failed to save order: ' + error.message);
        }

        console.log('Order saved successfully to Supabase:', data);

        // Dispatch event for order creation
        window.dispatchEvent(new CustomEvent('orderCreated', { detail: data }));
        
        return data;
    }

    // User Cart Management
    async getUserCart(userId) {
        if (!this.session) return { data: [], error: null };
        
        const result = await db.getUserCart(userId);
        if (result.error) {
            console.error('Error fetching user cart:', result.error);
            return { data: [], error: result.error };
        }
        return { data: result.data || [], error: null };
    }

    async addToUserCart(userId, product) {
        if (!this.session) {
            throw new Error('User not logged in');
        }

        const { data, error } = await db.addToUserCart(userId, product);
        if (error) {
            throw new Error('Failed to add to cart: ' + error.message);
        }
        return { data, error };
    }

    async updateUserCartItem(userId, productId, quantity) {
        if (!this.session) {
            throw new Error('User not logged in');
        }

        const { data, error } = await db.updateUserCartItem(userId, productId, quantity);
        if (error) {
            throw new Error('Failed to update cart item: ' + error.message);
        }
        return { data, error };
    }

    async clearUserCart(userId) {
        if (!this.session) {
            throw new Error('User not logged in');
        }

        const { data, error } = await db.clearUserCart(userId);
        if (error) {
            throw new Error('Failed to clear cart: ' + error.message);
        }
        return { data, error };
    }

    // User Profile Management
    async getUserProfile() {
        if (!this.session) return {};
        
        const { data, error } = await db.getUserProfile(this.session.user.id);
        if (error) {
            console.error('Error fetching user profile:', error);
            return {};
        }
        return data || {};
    }

    async updateUserProfile(profileData) {
        if (!this.session) {
            throw new Error('User not logged in');
        }

        const { data, error } = await db.updateUserProfile(this.session.user.id, profileData);
        if (error) {
            throw new Error('Failed to update profile: ' + error.message);
        }
        return data;
    }

    async signUp(email, password, name, role) {
        try {
            // Use new registration system
            const userData = {
                name: name,
                email: email,
                password: password
            };
            
            const newUser = await this.register(userData);
            toast.success('Account created successfully! You are now logged in.');
            return { success: true, user: newUser };
        } catch (error) {
            throw error;
        }
    }

    async signIn(email, password) {
        try {
            // Use new login system
            const session = await this.login(email, password);
            toast.success(`Welcome back, ${session.user.name}!`);
            
            // Don't call onAuthChange here - let the form handler do it
            // This prevents double redirects
            console.log('Login successful, role:', session.user.role);

            return { role: session.user.role };
        } catch (error) {
            throw error;
        }
    }

    async signOut() {
        try {
            this.session = null;
            this.user = null;
            storage.remove('session');
            
            if (this.onAuthChange) {
                this.onAuthChange(false, null);
            }
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }
    getToken() {
        return this.session?.access_token || storage.get('session')?.access_token;
    }

    getUser() {
        return this.user || storage.get('session')?.user;
    }

    getUserRole() {
        const user = this.getUser();
        console.log('Getting user role for user:', user);
        // Check both user.role and user.user_metadata.role
        const role = user?.role || user?.user_metadata?.role || 'customer';
        console.log('User role:', role);
        return role;
    }
    renderAuthPage() {
        const app = document.getElementById('app');
        if (!app) {
            console.error('App element not found');
            return;
        }
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
                <div class="w-full max-w-md">
                    <div class="text-center mb-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full mb-4">
                            <i data-lucide="shopping-bag" class="w-8 h-8 text-white"></i>
                        </div>
                        <h1 class="text-3xl font-bold text-gray-900">Mango Mart</h1>
                        <p class="text-gray-600 mt-2">Fresh groceries delivered to your doorstep</p>
                    </div>

                    <div class="bg-white rounded-lg shadow-lg p-8">
                        <div class="flex border-b mb-6">
                            <button id="signin-tab" class="flex-1 py-2 border-b-2 border-emerald-600 font-medium text-emerald-600">
                                Sign In
                            </button>
                            <button id="signup-tab" class="flex-1 py-2 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700">
                                Sign Up
                            </button>
                        </div>

                        <form id="signin-form" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input type="email" id="signin-identifier" required 
                                    class="input" placeholder="Enter your email address">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div class="relative">
                                <input type="password" id="signin-password" required 
                                        class="input pr-12" placeholder="••••••••">
                                    <button type="button" class="password-toggle absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                                            data-target="signin-password" aria-label="Toggle password visibility">
                                        <i data-lucide="eye" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="text-right">
                                <button type="button" id="forgot-password-btn" class="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                                    Forgot Password?
                                </button>
                            </div>
                            <button type="submit" class="w-full btn btn-primary">
                                Sign In
                            </button>
                        </form>
                        
                        <!-- Forgot Password Request Form -->
                        <form id="forgot-password-form" class="space-y-4 hidden">
                            <div class="text-center mb-4">
                                <h2 class="text-xl font-bold text-gray-900 mb-2">Reset Password</h2>
                                <p class="text-sm text-gray-600">Enter your email address to receive a reset code</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input type="email" id="forgot-identifier" required 
                                    class="input" placeholder="Enter your email address">
                            </div>
                            <div class="flex gap-2">
                                <button type="button" id="back-to-signin-btn" class="flex-1 btn btn-outline">
                                    Back
                                </button>
                                <button type="submit" class="flex-1 btn btn-primary">
                                    Send Reset Code
                                </button>
                            </div>
                        </form>
                        
                        <!-- Reset Password Form -->
                        <form id="reset-password-form" class="space-y-4 hidden">
                            <div class="text-center mb-4">
                                <h2 class="text-xl font-bold text-gray-900 mb-2">Enter Reset Code</h2>
                                <p class="text-sm text-gray-600">Enter the 6-digit code sent to your email/mobile</p>
                            </div>
                            <div id="reset-code-info" class="hidden p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                                <div class="flex items-start space-x-2">
                                    <i data-lucide="info" class="w-5 h-5 text-blue-600 mt-0.5"></i>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium text-blue-800 mb-1" id="reset-code-message"></p>
                                        <p class="text-xs text-blue-700">Please check your email for the 6-digit reset code. The code expires in 15 minutes.</p>
                                    </div>
                                </div>
                            </div>
                            <div id="reset-code-display" class="hidden p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
                                <p class="text-sm font-medium text-emerald-800 mb-1">Your Reset Code (Service Not Configured):</p>
                                <p class="text-2xl font-bold text-emerald-600 text-center" id="reset-code-value"></p>
                                <p class="text-xs text-emerald-700 mt-2 text-center">This code expires in 15 minutes</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input type="email" id="reset-identifier" required 
                                    class="input" placeholder="Enter your email address" readonly>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Reset Code</label>
                                <input type="text" id="reset-code" required 
                                    class="input text-center text-lg tracking-widest" placeholder="000000" maxlength="6" pattern="[0-9]{6}">
                                <p class="text-xs text-gray-500 mt-1">Enter the 6-digit code</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <div class="relative">
                                <input type="password" id="reset-new-password" required 
                                        class="input pr-12" placeholder="••••••••" minlength="6">
                                    <button type="button" class="password-toggle absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                                            data-target="reset-new-password" aria-label="Toggle password visibility">
                                        <i data-lucide="eye" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <div class="relative">
                                <input type="password" id="reset-confirm-password" required 
                                        class="input pr-12" placeholder="••••••••" minlength="6">
                                    <button type="button" class="password-toggle absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                                            data-target="reset-confirm-password" aria-label="Toggle password visibility">
                                        <i data-lucide="eye" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button type="button" id="back-to-forgot-btn" class="flex-1 btn btn-outline">
                                    Back
                                </button>
                                <button type="submit" class="flex-1 btn btn-primary">
                                    Reset Password
                                </button>
                            </div>
                        </form>

                        <form id="signup-form" class="space-y-4 hidden">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input type="text" id="signup-name" required 
                                    class="input" placeholder="Enter your name">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input type="email" id="signup-contact" required
                                    class="input" placeholder="Enter your email address">
                                <p class="text-xs text-gray-500 mt-1">Enter your email address</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
                                <div class="relative">
                                <input type="password" id="signup-password" required 
                                        class="input pr-12" placeholder="••••••••" minlength="6">
                                    <button type="button" class="password-toggle absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                                            data-target="signup-password" aria-label="Toggle password visibility">
                                        <i data-lucide="eye" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
<button type="submit" class="w-full btn btn-primary">
                                Create Account
                            </button>
                        </form>

                        
                    </div>
                </div>
            </div>
        `;

        initIcons();
        this.attachAuthHandlers();
    }

    attachAuthHandlers() {
        const signinTab = document.getElementById('signin-tab');
        const signupTab = document.getElementById('signup-tab');
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');

        signinTab.addEventListener('click', () => {
            signinTab.classList.add('border-emerald-600', 'text-emerald-600');
            signinTab.classList.remove('border-transparent', 'text-gray-500');
            signupTab.classList.remove('border-emerald-600', 'text-emerald-600');
            signupTab.classList.add('border-transparent', 'text-gray-500');
            signinForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        });

        signupTab.addEventListener('click', () => {
            signupTab.classList.add('border-emerald-600', 'text-emerald-600');
            signupTab.classList.remove('border-transparent', 'text-gray-500');
            signinTab.classList.remove('border-emerald-600', 'text-emerald-600');
            signinTab.classList.add('border-transparent', 'text-gray-500');
            signupForm.classList.remove('hidden');
            signinForm.classList.add('hidden');
        });

        const passwordToggleButtons = document.querySelectorAll('.password-toggle');
        passwordToggleButtons.forEach(button => {
            const targetId = button.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;

            button.addEventListener('click', () => {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                const icon = button.querySelector('i[data-lucide]');
                if (icon) {
                    icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
                    initIcons();
                }
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            });
        });

        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const identifier = document.getElementById('signin-identifier').value;
            const password = document.getElementById('signin-password').value;

            const loadingToast = toast.loading('Signing in...');
            try {
                await this.signIn(identifier, password);
                toast.dismiss(loadingToast);
                toast.success('Login successful! Redirecting...');
                
                if (this.onAuthChange) {
                    const session = JSON.parse(localStorage.getItem('session') || 'null');
                    const role = session?.user?.role || 'customer';
                    console.log('Redirecting with role:', role);
                    this.onAuthChange(true, role);
                }
            } catch (error) {
                toast.dismiss(loadingToast);
                toast.error(error.message || 'Failed to sign in');
            }
        });

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-contact').value.trim();
            const password = document.getElementById('signup-password').value;
            const role = 'customer'; // Default role since account type selector was removed

            // Validate email
            if (!isValidEmail(email)) {
                toast.error('Please enter a valid email address');
                return;
            }

            if (password.length < 6) {
                toast.error('Password must be at least 6 characters');
                return;
            }

            const loadingToast = toast.loading('Creating account...');
            try {
                const userData = {
                    name,
                    email,
                    password
                };
                
                await this.register(userData);
                toast.dismiss(loadingToast);
                toast.success('Account created successfully! Redirecting...');
                
                if (this.onAuthChange) {
                    const session = JSON.parse(localStorage.getItem('session') || 'null');
                    const role = session?.user?.role || 'customer';
                    console.log('Redirecting with role:', role);
                    this.onAuthChange(true, role);
                }
            } catch (error) {
                toast.dismiss(loadingToast);
                toast.error(error.message || 'Failed to create account');
                
                // If user already exists, switch to login tab and pre-fill the contact field
                if (error.message && error.message.includes('already registered')) {
                    // Switch to login tab
                    const signinTab = document.getElementById('signin-tab');
                    const signupTab = document.getElementById('signup-tab');
                    const signinForm = document.getElementById('signin-form');
                    const signupForm = document.getElementById('signup-form');
                    
                    if (signinTab && signupTab && signinForm && signupForm) {
                        signinTab.classList.add('border-emerald-600', 'text-emerald-600');
                        signinTab.classList.remove('border-transparent', 'text-gray-500');
                        signupTab.classList.remove('border-emerald-600', 'text-emerald-600');
                        signupTab.classList.add('border-transparent', 'text-gray-500');
                        signinForm.classList.remove('hidden');
                        signupForm.classList.add('hidden');
                        
                        // Pre-fill the login form with the contact info
                        const signinIdentifier = document.getElementById('signin-identifier');
                        if (signinIdentifier) {
                            signinIdentifier.value = email;
                        }
                    }
                }
            }
        });

        // Forgot Password Handlers
        const forgotPasswordBtn = document.getElementById('forgot-password-btn');
        const forgotPasswordForm = document.getElementById('forgot-password-form');
        const resetPasswordForm = document.getElementById('reset-password-form');
        const backToSigninBtn = document.getElementById('back-to-signin-btn');
        const backToForgotBtn = document.getElementById('back-to-forgot-btn');

        // Show forgot password form
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', () => {
                signinForm.classList.add('hidden');
                signupForm.classList.add('hidden');
                forgotPasswordForm.classList.remove('hidden');
            });
        }

        // Back to signin from forgot password
        if (backToSigninBtn) {
            backToSigninBtn.addEventListener('click', () => {
                forgotPasswordForm.classList.add('hidden');
                resetPasswordForm.classList.add('hidden');
                signinForm.classList.remove('hidden');
                // Clear form fields
                const forgotId = document.getElementById('forgot-identifier');
                const resetId = document.getElementById('reset-identifier');
                const resetCode = document.getElementById('reset-code');
                const resetNewPwd = document.getElementById('reset-new-password');
                const resetConfirmPwd = document.getElementById('reset-confirm-password');
                const resetCodeInfo = document.getElementById('reset-code-info');
                if (forgotId) forgotId.value = '';
                if (resetId) resetId.value = '';
                if (resetCode) resetCode.value = '';
                if (resetNewPwd) resetNewPwd.value = '';
                if (resetConfirmPwd) resetConfirmPwd.value = '';
                if (resetCodeInfo) resetCodeInfo.classList.add('hidden');
            });
        }

        // Back to forgot password from reset form
        if (backToForgotBtn) {
            backToForgotBtn.addEventListener('click', () => {
                resetPasswordForm.classList.add('hidden');
                forgotPasswordForm.classList.remove('hidden');
                const resetCode = document.getElementById('reset-code');
                const resetNewPwd = document.getElementById('reset-new-password');
                const resetConfirmPwd = document.getElementById('reset-confirm-password');
                if (resetCode) resetCode.value = '';
                if (resetNewPwd) resetNewPwd.value = '';
                if (resetConfirmPwd) resetConfirmPwd.value = '';
            });
        }

        // Forgot password form submit
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const identifier = document.getElementById('forgot-identifier').value.trim();

                if (!identifier) {
                    toast.error('Please enter your email address');
                    return;
                }

                if (!isValidEmail(identifier)) {
                    toast.error('Please enter a valid email address');
                    return;
                }

                const loadingToast = toast.loading('Sending reset code...');
                try {
                    const email = identifier; // Use email variable name for clarity
                    const result = await this.requestPasswordReset(email);
                    toast.dismiss(loadingToast);
                    
                    // Set email in reset form
                    const resetId = document.getElementById('reset-identifier');
                    const resetCodeInfo = document.getElementById('reset-code-info');
                    const resetCodeMessage = document.getElementById('reset-code-message');
                    
                    if (resetId) resetId.value = email;
                    
                    // Show info message
                    if (resetCodeInfo && resetCodeMessage) {
                        resetCodeMessage.textContent = 'Reset code has been sent to your email address.';
                        resetCodeInfo.classList.remove('hidden');
                    }
                    
                    // Switch to reset password form
                    forgotPasswordForm.classList.add('hidden');
                    resetPasswordForm.classList.remove('hidden');
                    
                    // Show appropriate message based on result
                    if (result.sentVia === 'email') {
                        toast.success('Reset code sent to your email! Please check your inbox.');
                    } else if (result.sentVia === 'not_configured' || result.fallbackCode) {
                        // Service not configured - show code as fallback
                        const resetCodeValue = document.getElementById('reset-code-value');
                        const resetCodeDisplay = document.getElementById('reset-code-display');
                        if (resetCodeValue && resetCodeDisplay && result.fallbackCode) {
                            resetCodeValue.textContent = result.fallbackCode;
                            resetCodeDisplay.classList.remove('hidden');
                        }
                        toast.warning('Email service not configured. Please check the code below or configure EmailJS in mango-mart.js');
                    } else {
                        toast.error(result.message || 'Failed to send reset code. Please try again.');
                    }
                } catch (error) {
                    toast.dismiss(loadingToast);
                    toast.error(error.message || 'Failed to send reset code');
                }
            });
        }

        // Reset password form submit
        if (resetPasswordForm) {
            resetPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('reset-identifier').value.trim();
                const code = document.getElementById('reset-code').value.trim();
                const newPassword = document.getElementById('reset-new-password').value;
                const confirmPassword = document.getElementById('reset-confirm-password').value;

                if (!code || code.length !== 6) {
                    toast.error('Please enter a valid 6-digit reset code');
                    return;
                }

                if (newPassword.length < 6) {
                    toast.error('Password must be at least 6 characters long');
                    return;
                }

                if (newPassword !== confirmPassword) {
                    toast.error('Passwords do not match');
                    return;
                }

                const loadingToast = toast.loading('Resetting password...');
                try {
                    await this.resetPassword(email, code, newPassword);
                    toast.dismiss(loadingToast);
                    toast.success('Password reset successfully! Please login with your new password.');
                    
                    // Clear forms and go back to signin
                    setTimeout(() => {
                        resetPasswordForm.classList.add('hidden');
                        signinForm.classList.remove('hidden');
                        const forgotId = document.getElementById('forgot-identifier');
                        const resetId = document.getElementById('reset-identifier');
                        const resetCode = document.getElementById('reset-code');
                        const resetNewPwd = document.getElementById('reset-new-password');
                        const resetConfirmPwd = document.getElementById('reset-confirm-password');
                        const resetCodeInfo = document.getElementById('reset-code-info');
                        const signinId = document.getElementById('signin-identifier');
                        if (forgotId) forgotId.value = '';
                        if (resetId) resetId.value = '';
                        if (resetCode) resetCode.value = '';
                        if (resetNewPwd) resetNewPwd.value = '';
                        if (resetConfirmPwd) resetConfirmPwd.value = '';
                        if (resetCodeInfo) resetCodeInfo.classList.add('hidden');
                        if (signinId) signinId.value = email;
                    }, 2000);
                } catch (error) {
                    toast.dismiss(loadingToast);
                    toast.error(error.message || 'Failed to reset password');
                }
            });
        }
    }
}
// ===== CUSTOMER DASHBOARD =====
class CustomerDashboard {
    constructor(authManager) {
        this.authManager = authManager;
        this.products = [];
        this.cart = [];
        this.orders = [];
        this.selectedCategory = null;
        this.searchQuery = '';
        this.activeTab = 'home';
        this.currentView = 'home'; // 'home', 'category', or 'product-detail'
        this.currentMainCategory = null;
        this.currentProductId = null; // Track current product being viewed
        this.previousView = 'home'; // Track previous view for back navigation
        this.previousMainCategory = null; // Track previous category
        this.searchTimeout = null; // For debouncing search
        this.processingCart = new Set(); // Track products currently being added to cart to prevent duplicate clicks
        
        // Cart will be loaded from Supabase via loadUserCart() in loadData()
        this.initializeSampleOrders();

        // SPA navigation state
        this._historyInitialized = false;
        this._suppressHistory = false;
        this._lastHistorySnapshot = null;
        this._currentHistoryIndex = 0;
        this._nextHistoryIndex = 0;
        this._onPopState = null;
    }

    setView(nextView) {
        const hasActiveSearch = !!(this.searchQuery && this.searchQuery.trim());
        if (hasActiveSearch) {
            this.currentView = 'search';
        } else {
            this.currentView = nextView;
        }
    }

    async init() {
        // Load data and render (Auth already initialized by MangoMartApp)
        await this.loadData();
        await this.handlePendingOnlineOrder();
        this.restoreViewState();

        if (this.currentView === 'cart') {
            await this.showCart({ skipHistory: true });
        } else if (this.currentView === 'product-detail' && this.currentProductId) {
            this.renderProductDetail();
        } else if (this.currentView === 'category' && this.currentMainCategory) {
            this.render();
        } else {
            this.currentView = 'home';
            this.render();
        }

        this.initializeHistory();
        this.saveViewState();
    }

    initializeSampleOrders() {
        const existingOrders = storage.get('orders');
        if (!existingOrders || existingOrders.length === 0) {
            const sampleOrders = [
                {
                    id: 'ORD001',
                    customerId: 'customer1',
                    customerName: 'John Doe',
                    customerEmail: 'john@example.com',
                    items: [
                        { id: '1', name: 'Fresh Mangoes', price: 120, quantity: 2, image: 'https://images.unsplash.com/photo-1605027990121-1b5a3b3b3b3b?w=400' },
                        { id: '2', name: 'Bananas', price: 60, quantity: 1, image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b9e5?w=400' }
                    ],
                    total: 300,
                    status: 'pending',
                    paymentMethod: 'Credit Card',
                    deliveryAddress: '123 Main St, City, State',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'ORD002',
                    customerId: 'customer1',
                    customerName: 'John Doe',
                    customerEmail: 'john@example.com',
                    items: [
                        { id: '4', name: 'Rice (1kg)', price: 45, quantity: 2, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
                        { id: '5', name: 'Lentils (500g)', price: 80, quantity: 1, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' }
                    ],
                    total: 170,
                    status: 'delivered',
                    paymentMethod: 'Cash on Delivery',
                    deliveryAddress: '123 Main St, City, State',
                    createdAt: new Date(Date.now() - 172800000).toISOString(),
                    updatedAt: new Date(Date.now() - 172800000).toISOString()
                },
                {
                    id: 'ORD003',
                    customerId: 'customer1',
                    customerName: 'John Doe',
                    customerEmail: 'john@example.com',
                    items: [
                        { id: '6', name: 'Notebook', price: 25, quantity: 3, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' },
                        { id: '7', name: 'Pen Set', price: 50, quantity: 1, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' }
                    ],
                    total: 125,
                    status: 'out_for_delivery',
                    paymentMethod: 'UPI',
                    deliveryAddress: '123 Main St, City, State',
                    createdAt: new Date(Date.now() - 259200000).toISOString(),
                    updatedAt: new Date(Date.now() - 259200000).toISOString()
                }
            ];
            storage.set('orders', sampleOrders);
        }
    }

    async loadData() {
        try {
            // Load products directly from Supabase
            if (supabase && supabaseReady) {
                try {
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (productsError) {
                    console.error('Error loading products from Supabase:', productsError);
                        // Fallback to API on error
                        console.log('Falling back to API for products...');
                        const productsRes = await api.getProducts();
                        this.products = productsRes.products || [];
                        console.log('Products loaded from API (fallback):', this.products.length);
                } else {
                    this.products = productsData || [];
                    console.log('Products loaded from Supabase:', this.products.length);
                    }
                } catch (fetchError) {
                    console.error('Network error loading products from Supabase:', fetchError);
                    // Fallback to API on network error
                    console.log('Falling back to API for products due to network error...');
                    try {
                        const productsRes = await api.getProducts();
                        this.products = productsRes.products || [];
                        console.log('Products loaded from API (fallback):', this.products.length);
                    } catch (apiError) {
                        console.error('API fallback also failed:', apiError);
                        this.products = [];
                        toast.error('Failed to load products. Please check your internet connection.');
                    }
                }
            } else {
                // Fallback to API if Supabase not ready
                console.log('Supabase not ready, using API...');
                const productsRes = await api.getProducts();
                this.products = productsRes.products || [];
                console.log('Products loaded from API:', this.products.length);
            }
            
            await this.loadUserCart();
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        }
    }

    // Cart is now loaded from Supabase only via loadUserCart()

    getFilteredProducts() {
        let filtered = [...this.products];
        
        // If we're on a category page, filter by main category first
        if (this.currentView === 'category' && this.currentMainCategory) {
            const mainCategory = mainCategories.find(cat => cat.id === this.currentMainCategory);
            if (mainCategory) {
                // Check both category and subcategory fields for compatibility
                filtered = filtered.filter(p => {
                    const productCategory = p.subcategory || p.category;
                    return mainCategory.subcategories.includes(productCategory);
                });
            }
        }
        
        // Then filter by selected subcategory
        if (this.selectedCategory) {
            filtered = filtered.filter(p => {
                const productCategory = p.subcategory || p.category;
                return productCategory === this.selectedCategory;
            });
        }
        
        // Finally filter by search query
        if (this.searchQuery) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }
        
        return filtered;
    }

    getSearchResults() {
        if (!this.searchQuery) return [];
        
        return this.products.filter(p => {
            const productCategory = p.subcategory || p.category;
            return p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                productCategory.toLowerCase().includes(this.searchQuery.toLowerCase());
        });
    }

    getRelevantProducts() {
        if (!this.searchQuery) return [];
        
        const searchResults = this.getSearchResults();
        const searchResultCategories = [...new Set(searchResults.map(p => p.category))];
        
        // Get products from the same categories as search results, excluding exact matches
        return this.products.filter(p => 
            searchResultCategories.includes(p.category) && 
            !searchResults.some(result => result.id === p.id)
        ).slice(0, 8); // Limit to 8 relevant products
    }

    updateSearchResults() {
        // Only update the main content area without full page render
        const main = document.querySelector('main.max-w-7xl');
        if (!main) return;
        
        const searchResults = this.getSearchResults();
        
        if (this.searchQuery && this.searchQuery.trim()) {
            const resultsHtml = searchResults.map(product => {
                const stock = product.stock_quantity !== undefined ? product.stock_quantity : product.stock;
                const cartItem = this.cart.find(item => item.id === product.id);
                const quantity = cartItem ? cartItem.quantity : 0;
                return `
                    <div class="product-card h-full flex flex-col cursor-pointer" data-product-id="${product.id}" data-product-clickable="true">
                        <div class="product-image-container">
                            <img src="${product.image}" alt="${product.name}">
                        </div>
                        <div class="p-4 flex flex-col h-full">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">${product.name}</h3>
                            <p class="text-sm text-gray-600 mb-3" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${product.description || ''}</p>
                            <div class="mt-auto space-y-3">
                                <div class="product-price-display">
                                    <span class="product-price-amount">${formatCurrency(product.price)}</span>
                                    <span class="product-price-stock">${product.stock_quantity !== undefined ? `Stock: ${product.stock_quantity}` : ''}</span>
                                </div>
                                <div class="product-action" data-product-action="${product.id}">
                                    <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${product.id}">
                                        Add to Cart
                                    </button>
                                    <template data-template="add">
                                        <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${product.id}">
                                            Add to Cart
                                        </button>
                                    </template>
                                    <template data-template="quantity">
                                        <div class="flex items-center justify-between gap-3">
                                            <button class="quantity-btn w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                    data-product-id="${product.id}" data-action="decrease">
                                                <i data-lucide="minus" class="w-5 h-5 sm:w-4 sm:h-4"></i>
                                            </button>
                                            <span class="quantity-display font-semibold text-gray-900 min-w-[2.5rem] text-center text-lg sm:text-base" data-product-quantity="${product.id}">${quantity}</span>
                                            <button class="quantity-btn w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                    data-product-id="${product.id}" data-action="increase">
                                                <i data-lucide="plus" class="w-5 h-5 sm:w-4 sm:h-4"></i>
                                            </button>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            main.innerHTML = `
                <div class="mb-6 flex items-center justify-between">
                    <h2 class="text-2xl font-bold text-gray-900">Results for "${this.searchQuery.replace(/[`$]/g,'') }"</h2>
                    <button id="clear-search" class="text-sm text-gray-600 hover:text-gray-800">Clear</button>
                </div>
                <div class="search-results-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    ${resultsHtml}
                </div>
            `;

            searchResults.forEach(product => this.updateProductCardUI(product.id));
        } else {
            // Show welcome section and categories
            main.innerHTML = `
                <!-- Welcome Section -->
                <div class="text-center py-12 mb-12">
                    <h2 class="text-4xl font-bold text-gray-900 mb-4">Welcome to Mango Mart</h2>
                    <p class="text-xl text-gray-600 mb-8">Choose a category below to start shopping</p>
                    <div class="flex justify-center space-x-8">
                        <div class="text-center">
                            <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i data-lucide="truck" class="w-10 h-10 text-emerald-600"></i>
                            </div>
                            <p class="text-sm font-medium text-gray-700">Fast Delivery</p>
                        </div>
                        <div class="text-center">
                            <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i data-lucide="shield-check" class="w-10 h-10 text-blue-600"></i>
                            </div>
                            <p class="text-sm font-medium text-gray-700">Quality Assured</p>
                        </div>
                        <div class="text-center">
                            <div class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i data-lucide="credit-card" class="w-10 h-10 text-orange-600"></i>
                            </div>
                            <p class="text-sm font-medium text-gray-700">Easy Payment</p>
                        </div>
                    </div>
                </div>

                <!-- Categories Section -->
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Shop by Category</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                        ${mainCategories.map(category => {
                            const categoryProducts = this.products.filter(p => category.subcategories.includes(p.subcategory || p.category));
                            return `
                                <div class="main-category-card bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer"
                                     data-category="${category.id}" style="min-height: 320px; height: auto;">
                                    <div class="h-full min-h-[320px] bg-gradient-to-br ${category.color} p-8 flex flex-col justify-between text-white relative">
                                        <div class="absolute inset-0 opacity-15">
                                            <div class="absolute top-4 right-4 w-40 h-40 rounded-full bg-white blur-2xl"></div>
                                            <div class="absolute bottom-4 left-4 w-32 h-32 rounded-full bg-white blur-xl"></div>
                                            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white blur-lg"></div>
                                        </div>
                                        <div class="relative z-10">
                                            <div class="flex items-center justify-between mb-6">
                                                <div class="p-3 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                                                    <i data-lucide="${category.icon}" class="w-10 h-10"></i>
                                                </div>
                                                <span class="category-highlight-pill">
                                                    Explore
                                                </span>
                                            </div>
                                            <h3 class="text-3xl font-bold mb-3 drop-shadow-lg">${category.name}</h3>
                                            <p class="text-white text-opacity-95 mb-6 text-lg font-medium">${category.description}</p>
                                            <div class="flex flex-wrap gap-2">
                                                ${category.subcategories.map(sub => {
                                                    const subcat = sampleCategories.find(c => c.id === sub);
                                                    return subcat ? `
                                                        <span class="text-xs font-medium bg-white bg-opacity-25 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white border-opacity-30">
                                                            ${subcat.name}
                                                        </span>
                                                    ` : '';
                                                }).join('')}
                                            </div>
                                        </div>
                                        <div class="relative z-10 flex justify-end items-center">
                                            <div class="p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full border border-white border-opacity-30">
                                                <i data-lucide="arrow-right" class="w-5 h-5"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        // Re-attach event listeners for the updated content
        // Product card listeners (add to cart, quantity buttons)
        // Use event delegation for add-to-cart buttons to prevent duplicate listeners
        const app = document.getElementById('app');
        if (app) {
            // Remove old listeners if they exist
            if (this._addToCartHandler) {
                app.removeEventListener('click', this._addToCartHandler);
            }
            if (this._quantityBtnHandler) {
                app.removeEventListener('click', this._quantityBtnHandler);
            }
            
            // Add-to-cart button handler (event delegation)
            this._addToCartHandler = (e) => {
                const btn = e.target.closest('.add-to-cart-btn');
                if (btn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const productId = btn.dataset.productId;
                    const product = this.products.find(p => p.id === productId);
                    if (product) this.addToCart(product);
                }
            };
            app.addEventListener('click', this._addToCartHandler);
            
            // Quantity button handler (event delegation)
            this._quantityBtnHandler = (e) => {
                const btn = e.target.closest('.quantity-btn');
                if (btn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const productId = btn.dataset.productId;
                    const action = btn.dataset.action;
                    const product = this.products.find(p => p.id === productId);
                    if (product) {
                        const cartItem = this.cart.find(item => String(item.id) === String(productId));
                        const currentQuantity = cartItem ? cartItem.quantity : 0;
                        if (action === 'increase') {
                            this.addToCart(product);
                        } else if (action === 'decrease') {
                            this.updateCartQuantity(productId, currentQuantity - 1);
                        }
                    }
                }
            };
            app.addEventListener('click', this._quantityBtnHandler);
        }
        
        // Product card click listeners (for viewing product details)
        document.querySelectorAll('[data-product-clickable="true"]').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on buttons or interactive elements
                if (e.target.closest('button') || e.target.closest('.add-to-cart-btn') || e.target.closest('.quantity-btn')) {
                    return;
                }
                const productId = card.dataset.productId;
                if (productId) {
                    this.showProductDetail(productId);
                }
            });
        });

        // Category card listeners
        document.querySelectorAll('.main-category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const categoryId = card.dataset.category;
                this.currentMainCategory = categoryId;
                this.selectedCategory = null;
                this.setView('category');
                this.render();
            });
        });
        
        // Re-attach clear search button
        const clearSearchBtn = document.getElementById('clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.searchQuery = '';
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = '';
                }
                this.setView('home');
                this.updateSearchResults();
            });
        }
        
        initIcons();
    }

    async addToCart(product) {
        // Prevent duplicate clicks - if this product is already being processed, ignore
        if (this.processingCart.has(product.id)) {
            console.log('Product already being added to cart, ignoring duplicate click');
            return;
        }

        // Check if product is out of stock (check both field names)
        const stock = product.stock_quantity !== undefined ? product.stock_quantity : product.stock;
        if (stock === 0 || product.status === 'out_of_stock') {
            toast.error('This product is out of stock and cannot be ordered');
            return;
        }

        // Get current user
        const currentUser = this.authManager.getUser();
        
        if (!currentUser) {
            toast.error('Please login to add items to cart');
            return;
        }

        // Get user ID from the user object
        const userId = currentUser.id || currentUser.user_metadata?.id;
        if (!userId) {
            console.error('User ID not found in user object:', currentUser);
            toast.error('User session error. Please login again.');
            return;
        }

        // Validate user ID is a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(String(userId).trim())) {
            toast.error('Invalid user session. Please login again.');
            return;
        }

        // Mark this product as being processed
        this.processingCart.add(product.id);

        // Ensure product has all required properties
        const cartProduct = {
            id: product.id,
            name: product.name || 'Unknown Product',
            price: product.price || 0,
            image: product.image || 'https://via.placeholder.com/400x300?text=No+Image',
            description: product.description || '',
            category: product.category || 'general',
            stock: product.stock || 0,
            status: product.status || 'in_stock',
            quantity: 1
        };

        const existingItem = this.cart.find(item => item.id === product.id);
        const previousQuantity = existingItem ? (parseInt(existingItem.quantity) || 0) : 0;
        let optimisticItem = existingItem;

        // Optimistic update for immediate feedback
        if (existingItem) {
            optimisticItem.quantity = previousQuantity + 1;
        } else {
            optimisticItem = { ...cartProduct };
            this.cart.push(optimisticItem);
        }

        this.updateCartCount();
        this.updateProductCardUI(product.id);
        toast.success(`${cartProduct.name} added to cart!`);

        if (this.currentView === "cart") {
            this.showCart({ skipHistory: true });
        }

        try {
            if (existingItem) {
                const result = await this.authManager.updateUserCartItem(userId, product.id, optimisticItem.quantity);

                if (result.error) {
                    throw result.error;
                }

                const updatedRecord = Array.isArray(result.data) ? result.data[0] : result.data;
                const confirmedQuantity = parseInt(updatedRecord?.quantity) || optimisticItem.quantity;
                optimisticItem.quantity = confirmedQuantity;
            } else {
                const result = await this.authManager.addToUserCart(userId, cartProduct);

                if (result.error) {
                    throw result.error;
                }

                const returnedItem = Array.isArray(result.data) ? result.data[0] : result.data;
                const confirmedQuantity = parseInt(returnedItem?.quantity) || 1;
                optimisticItem.quantity = confirmedQuantity;
            }
        } catch (error) {
            console.error('Cart save error:', error);
            toast.error('Failed to save to cart. Please try again.');

            if (existingItem) {
                optimisticItem.quantity = previousQuantity;
            } else {
                this.cart = this.cart.filter(item => item.id !== product.id);
            }

            await this.loadUserCart();
        } finally {
            this.updateCartCount();
            this.updateProductCardUI(product.id);
            this.processingCart.delete(product.id);
        }
    }
    async recordFailedOrder(orderData, failureReason = 'Payment not completed') {
        const sessionUser = this.authManager.getUser();
        if (!sessionUser) {
            return;
        }

        const userId = sessionUser.id || sessionUser.user_metadata?.id;
        if (!userId) {
            return;
        }

        const failureTimestamp = new Date().toISOString();
        const orderId = orderData?.id || `ORD-${Date.now()}`;
        const firstItem = orderData?.items && orderData.items.length > 0 ? orderData.items[0] : null;

        const failedOrderRecord = {
            id: orderId,
            customer_id: userId,
            customer_name: orderData.customerName || sessionUser.name || 'Customer',
            customer_email: sessionUser.email || null,
            customer_mobile: orderData.customerMobile || sessionUser.mobile || null,
            customer_address: orderData.customerAddress || '',
            customer_landmark: orderData.customerLandmark || '',
            customer_pincode: orderData.customerPincode || '',
            items: orderData.items || [],
            product_id: firstItem ? firstItem.id : null,
            total_amount: orderData.totalAmount || orderData.total || 0,
            status: 'cancelled',
            payment_status: 'failed',
            payment_id: null,
            payment_signature: null,
            created_at: orderData.createdAt || failureTimestamp,
            updated_at: failureTimestamp,
            paid_at: null,
            delivery_status: 'cancelled'
        };

        try {
            if (supabase && supabaseReady) {
                const { data: existingOrders, error: checkError } = await supabase
                    .from('orders')
                    .select('id')
                    .eq('id', failedOrderRecord.id)
                    .limit(1);

                if (checkError) {
                    console.error('Error checking existing failed order:', checkError);
                }

                if (!checkError && existingOrders && existingOrders.length > 0) {
                    console.log('Failed order already recorded in Supabase, skipping insert.');
                } else {
                    const { error: insertError } = await supabase
                        .from('orders')
                        .insert([failedOrderRecord]);

                    if (insertError) {
                        console.error('Failed to log failed order in Supabase:', insertError);
                        throw insertError;
                    }
                }
            } else {
                throw new Error('Supabase not available');
            }
        } catch (error) {
            console.warn('Falling back to local storage for failed order logging:', error);
            const localOrders = storage.get('orders') || [];
            localOrders.push({
                id: failedOrderRecord.id,
                customerId: failedOrderRecord.customer_id,
                customerName: failedOrderRecord.customer_name,
                customerEmail: failedOrderRecord.customer_email,
                customerMobile: failedOrderRecord.customer_mobile,
                items: failedOrderRecord.items,
                total: failedOrderRecord.total_amount,
                status: 'cancelled',
                payment_status: 'failed',
                paymentMethod: 'Online Payment',
                delivery_status: 'cancelled',
                createdAt: failedOrderRecord.created_at,
                updatedAt: failedOrderRecord.updated_at
            });
            storage.set('orders', localOrders);
        }

        const alreadyPresent = this.orders.some(order => order.id === failedOrderRecord.id);
        if (!alreadyPresent) {
            this.orders.unshift({
                id: failedOrderRecord.id,
                customerId: failedOrderRecord.customer_id,
                customer_name: failedOrderRecord.customer_name,
                customer_email: failedOrderRecord.customer_email,
                customer_mobile: failedOrderRecord.customer_mobile,
                customer_address: failedOrderRecord.customer_address,
                customer_landmark: failedOrderRecord.customer_landmark,
                customer_pincode: failedOrderRecord.customer_pincode,
                items: failedOrderRecord.items,
                total: failedOrderRecord.total_amount,
                total_amount: failedOrderRecord.total_amount,
                status: failedOrderRecord.status,
                payment_status: failedOrderRecord.payment_status,
                payment_status_label: 'Payment Failed',
                paymentMethod: 'Online Payment',
                payment_method: 'online',
                payment_id: failedOrderRecord.payment_id,
                delivery_status: failedOrderRecord.delivery_status,
                createdAt: failedOrderRecord.created_at,
                created_at: failedOrderRecord.created_at,
                updatedAt: failedOrderRecord.updated_at,
                updated_at: failedOrderRecord.updated_at
            });
        }

        return failedOrderRecord;
    }

    async handleOnlinePaymentFailure(orderData, response) {
        console.error('Payment failed or cancelled:', response?.error || response);
        await this.recordFailedOrder(orderData, response?.error?.description || 'Payment failed');
        localStorage.removeItem('pendingOrder');
        toast.error('Payment failed. Please try again.');
        this.resetPlaceOrderButton();
    }

    async handlePendingOnlineOrder() {
        const pendingOrderRaw = localStorage.getItem('pendingOrder');
        if (!pendingOrderRaw) {
            return;
        }

        let pendingOrder = null;
        try {
            pendingOrder = JSON.parse(pendingOrderRaw);
        } catch (error) {
            console.error('Failed to parse pending order:', error);
            localStorage.removeItem('pendingOrder');
            return;
        }

        const method = (pendingOrder.paymentMethod || pendingOrder.payment_method || '').toLowerCase();
        const status = (pendingOrder.paymentStatus || pendingOrder.payment_status || '').toLowerCase();

        if (method === 'cod' || status === 'cash_on_delivery') {
            localStorage.removeItem('pendingOrder');
            return;
        }

        await this.recordFailedOrder(pendingOrder, 'Payment window closed before completion');
        localStorage.removeItem('pendingOrder');
        toast.error('Online payment was not completed. Your order was cancelled.');
        this.resetPlaceOrderButton();
    }

    updateCartCount() {
        const cartCountElements = document.querySelectorAll('#cart-count');
        const totalItems = this.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
            if (totalItems > 0) {
                element.classList.add('animate-pulse');
            } else {
                element.classList.remove('animate-pulse');
            }
        });
    }

    calculateCartTotals() {
        const subtotal = this.cart.reduce((sum, item) => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;
            return sum + price * quantity;
        }, 0);

        if (subtotal <= 0 || this.cart.length === 0) {
            return {
                subtotal: 0,
                platformFee: 0,
                deliveryCharge: 0,
                total: 0,
                qualifiesForFreeDelivery: false,
                deliveryThreshold: 100
            };
        }

        const platformFee = 5;
        const deliveryThreshold = 100;
        const qualifiesForFreeDelivery = subtotal > deliveryThreshold;
        const deliveryCharge = qualifiesForFreeDelivery ? 0 : 10;
        const total = subtotal + platformFee + deliveryCharge;

        return {
            subtotal,
            platformFee,
            deliveryCharge,
            total,
            qualifiesForFreeDelivery,
            deliveryThreshold
        };
    }

    saveViewState() {
        try {
            const state = {
                view: this.currentView,
                mainCategory: this.currentMainCategory,
                productId: this.currentProductId,
                selectedCategory: this.selectedCategory,
                searchQuery: this.searchQuery,
                timestamp: Date.now()
            };
            localStorage.setItem('mango-view-state', JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save view state:', error);
        }
    }
    restoreViewState() {
        try {
            const rawState = localStorage.getItem('mango-view-state');
            if (!rawState) return;

            const state = JSON.parse(rawState);
            if (!state || typeof state !== 'object') return;

            const allowedViews = ['home', 'category', 'product-detail', 'cart'];
            let nextView = allowedViews.includes(state.view) ? state.view : 'home';

            this.searchQuery = state.searchQuery || '';
            this.selectedCategory = state.selectedCategory || null;

            // Validate main category
            if (nextView === 'category') {
                const categoryExists = mainCategories.some(cat => cat.id === state.mainCategory);
                if (categoryExists) {
                    this.currentMainCategory = state.mainCategory;
                } else {
                    nextView = 'home';
                    this.currentMainCategory = null;
                }
            } else {
                this.currentMainCategory = state.mainCategory || null;
            }

            // Validate product detail
            if (nextView === 'product-detail') {
                const productExists = this.products.some(p => String(p.id) === String(state.productId));
                if (productExists) {
                    this.currentProductId = state.productId;
                } else {
                    nextView = 'home';
                    this.currentProductId = null;
                }
            } else {
                this.currentProductId = null;
            }

            // If cart was stored, keep current cart view if there are items or allow empty
            if (nextView === 'cart' && !Array.isArray(this.cart)) {
                nextView = 'home';
            }

            this.currentView = nextView || 'home';
        } catch (error) {
            console.warn('Failed to restore view state:', error);
            this.currentView = 'home';
        }
    }

    serializeState() {
        return {
            view: this.currentView,
            productId: this.currentProductId,
            mainCategory: this.currentMainCategory,
            selectedCategory: this.selectedCategory,
            searchQuery: this.searchQuery
        };
    }

    initializeHistory() {
        if (this._historyInitialized || typeof window === 'undefined' || !window.history) {
            return;
        }

        this._historyInitialized = true;
        this._suppressHistory = false;
        this._currentHistoryIndex = 0;
        this._nextHistoryIndex = 0;

        const baseState = this.serializeState();
        this._lastHistorySnapshot = JSON.stringify(baseState);

        window.history.replaceState({ ...baseState, index: this._currentHistoryIndex }, '');

        if (!this._onPopState) {
            this._onPopState = (event) => this.handlePopState(event);
        }
        window.addEventListener('popstate', this._onPopState);
    }

    handlePopState(event) {
        if (!this._historyInitialized) {
            return;
        }
        this.restoreHistoryState(event?.state);
    }

    restoreHistoryState(state) {
        const fallbackState = { view: 'home', productId: null, mainCategory: null, selectedCategory: null, searchQuery: '' };
        const targetState = state && typeof state === 'object' ? state : fallbackState;

        this._suppressHistory = true;
        this._currentHistoryIndex = targetState.index ?? 0;
        if (this._nextHistoryIndex < this._currentHistoryIndex) {
            this._nextHistoryIndex = this._currentHistoryIndex;
        }

        this.currentView = targetState.view || 'home';
        this.currentProductId = targetState.productId || null;
        this.currentMainCategory = targetState.mainCategory || null;
        this.selectedCategory = targetState.selectedCategory || null;
        this.searchQuery = targetState.searchQuery || '';

        if (this.currentView === 'cart') {
            this.showCart({ skipHistory: true });
        } else if (this.currentView === 'product-detail' && this.currentProductId) {
            this.showProductDetail(this.currentProductId, { skipHistory: true });
        } else if (this.currentView === 'category' && this.currentMainCategory) {
            this.render();
        } else {
            this.currentView = 'home';
            this.render();
        }

        this._lastHistorySnapshot = JSON.stringify(this.serializeState());
        this._suppressHistory = false;
    }

    pushHistoryState({ replace = false } = {}) {
        if (!this._historyInitialized || this._suppressHistory || typeof window === 'undefined' || !window.history) {
            return;
        }

        const baseState = this.serializeState();
        const snapshot = JSON.stringify(baseState);

        if (!replace && snapshot === this._lastHistorySnapshot) {
            return;
        }

        if (replace) {
            window.history.replaceState({ ...baseState, index: this._currentHistoryIndex }, '');
        } else {
            this._nextHistoryIndex = Math.max(this._nextHistoryIndex + 1, this._currentHistoryIndex + 1);
            this._currentHistoryIndex = this._nextHistoryIndex;
            window.history.pushState({ ...baseState, index: this._currentHistoryIndex }, '');
        }

        this._lastHistorySnapshot = snapshot;
    }

    safeGoBack(fallback) {
        if (this._historyInitialized && this._currentHistoryIndex > 0) {
            window.history.back();
            return true;
        }

        if (typeof fallback === 'function') {
            fallback();
        }

        return false;
    }

    updateProductCardUI(productId) {
        // Find the product card container - try multiple selectors
        let productCard = document.querySelector(`.add-to-cart-btn[data-product-id="${productId}"]`)?.closest('.product-card');
        if (!productCard) {
            productCard = document.querySelector(`.quantity-btn[data-product-id="${productId}"]`)?.closest('.product-card');
        }
        if (!productCard) {
            productCard = document.querySelector(`.add-to-cart-btn[data-product-id="${productId}"]`)?.closest('.bg-white.rounded-lg');
        }
        if (!productCard) {
            productCard = document.querySelector(`.add-to-cart-btn[data-product-id="${productId}"]`)?.closest('div[class*="bg-white"]');
        }
        if (!productCard) {
            // Last resort: find any parent container with the button
            const btn = document.querySelector(`.add-to-cart-btn[data-product-id="${productId}"], .quantity-btn[data-product-id="${productId}"]`);
            if (btn) {
                productCard = btn.closest('div[class*="rounded"]') || btn.closest('div[class*="shadow"]') || btn.parentElement?.parentElement;
            }
        }
        
        if (!productCard) return;
        
        // Get current quantity from cart - ensure we use the actual quantity value from Supabase
        const cartItem = this.cart.find(item => String(item.id) === String(productId));
        // Parse quantity to ensure it's a number and matches Supabase (handle both number and string)
        const quantity = cartItem ? (parseInt(cartItem.quantity) || 0) : 0;
        const product = this.products.find(p => p.id === productId);
        
        if (!product) return;

        const stock = product.stock_quantity !== undefined ? product.stock_quantity : product.stock;
        const isOutOfStock = stock === 0 || product.status === 'out_of_stock';

        const actionWrapper = productCard.querySelector(`[data-product-action="${productId}"]`);
        const priceRow = productCard.querySelector('.product-price-row');
        if (priceRow && priceRow.dataset.originalPrice === undefined) {
            priceRow.dataset.originalPrice = priceRow.innerHTML;
        }
        const restorePriceRow = () => {
            if (!priceRow) return;
            if (priceRow.dataset.originalPrice) {
                priceRow.innerHTML = priceRow.dataset.originalPrice;
            }
        };

        const renderWithTemplates = (mode) => {
            if (!actionWrapper) return false;

            const addTemplate = actionWrapper.querySelector('template[data-template="add"]');
            const qtyTemplate = actionWrapper.querySelector('template[data-template="quantity"]');

            Array.from(actionWrapper.children).forEach(child => {
                if (child.tagName !== 'TEMPLATE') {
                    child.remove();
                }
            });

            if (mode === 'out') {
                const outBtn = document.createElement('button');
                outBtn.className = 'w-full btn btn-outline cursor-not-allowed opacity-50 text-sm py-2';
                outBtn.disabled = true;
                outBtn.textContent = 'Out of Stock';
                actionWrapper.appendChild(outBtn);
                restorePriceRow();
                return true;
            }

            if (mode === 'add' && addTemplate) {
                actionWrapper.appendChild(addTemplate.content.cloneNode(true));
                restorePriceRow();
                return true;
            }

            if (mode === 'quantity' && qtyTemplate) {
                actionWrapper.appendChild(qtyTemplate.content.cloneNode(true));
                restorePriceRow();
                return true;
            }

            return false;
        };

        const ensureQuantityDisplay = () => {
            const qtyDisplay = productCard.querySelector(`[data-product-quantity="${productId}"]`) || productCard.querySelector('.quantity-display');
            if (qtyDisplay) {
                qtyDisplay.textContent = quantity;
            }
        };

        const renderFallback = (mode) => {
        // Find the button/controls area more precisely
            const addToCartBtn = productCard.querySelector(`.add-to-cart-btn[data-product-id="${productId}"]`);
            const quantityControls = productCard.querySelector(`.quantity-btn[data-product-id="${productId}"]`)?.closest('.flex.items-center');
        const p4Div = productCard.querySelector('.p-4');
            if (!p4Div && !addToCartBtn && !quantityControls) return false;
        
        let buttonContainer = null;
        
        if (addToCartBtn) {
            const parent = addToCartBtn.parentElement;
            if (parent === p4Div) {
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'button-container';
                p4Div.insertBefore(buttonContainer, addToCartBtn);
                addToCartBtn.remove();
            } else {
                buttonContainer = parent;
            }
        } else if (quantityControls) {
            buttonContainer = quantityControls.parentElement;
            } else if (p4Div) {
            const children = Array.from(p4Div.children);
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (child.tagName === 'BUTTON' || 
                    child.classList.contains('flex') || 
                    child.querySelector('.quantity-btn') ||
                    child.classList.contains('add-to-cart-btn')) {
                    buttonContainer = child;
                    break;
                }
            }
            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'button-container';
                p4Div.appendChild(buttonContainer);
            }
        }
        
            if (!buttonContainer) return false;

            if (mode === 'out') {
            buttonContainer.innerHTML = `
                <button class="w-full btn btn-outline cursor-not-allowed opacity-50" disabled>
                    Out of Stock
                </button>
            `;
                restorePriceRow();
                return true;
            }

            if (mode === 'add') {
            buttonContainer.innerHTML = `
                <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${productId}">
                    Add to Cart
                </button>
            `;
                restorePriceRow();
                return true;
            }

            if (mode === 'quantity') {
            buttonContainer.innerHTML = `
                <div class="flex items-center justify-center space-x-3">
                    <button class="quantity-btn w-14 h-14 md:w-10 md:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                            data-product-id="${productId}" data-action="decrease">
                        <i data-lucide="minus" class="w-6 h-6 md:w-4 md:h-4"></i>
                    </button>
                    <span class="quantity-display font-semibold text-gray-900 min-w-[3rem] md:min-w-[2rem] text-center text-lg md:text-base">${quantity}</span>
                    <button class="quantity-btn w-14 h-14 md:w-10 md:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                            data-product-id="${productId}" data-action="increase">
                        <i data-lucide="plus" class="w-6 h-6 md:w-4 md:h-4"></i>
                    </button>
                </div>
            `;
            initIcons();
                restorePriceRow();
                return true;
            }

            return false;
        };

        if (isOutOfStock) {
            const rendered = renderWithTemplates('out') || renderFallback('out');
            if (rendered) {
                ensureQuantityDisplay();
            }
        } else if (quantity === 0) {
            const rendered = renderWithTemplates('add') || renderFallback('add');
            if (rendered) {
                ensureQuantityDisplay();
            }
                    } else {
            const rendered = renderWithTemplates('quantity') || renderFallback('quantity');
            if (rendered) {
                ensureQuantityDisplay();
                    }
                }

        if (actionWrapper) {
            initIcons();
            }
        return quantity;
    }

    async loadUserCart() {
        const currentUser = this.authManager.getUser();
        if (!currentUser) {
            this.cart = [];
            this.updateCartCount();
            return;
        }

        const userId = currentUser.id || currentUser.user_metadata?.id;
        if (!userId) {
            console.error('User ID not found in user object:', currentUser);
            this.cart = [];
            this.updateCartCount();
            return;
        }

        try {
            const result = await this.authManager.getUserCart(userId);
            
            if (result.error) {
                console.error('Error loading cart from Supabase:', result.error);
                
                // Check if it's a table access error (406)
                if (result.error.isTableError || result.error.status === 406 || result.error.statusCode === 406) {
                    toast.error('Cart table not set up. Please run create_user_carts_table.sql in Supabase SQL Editor.', 10000);
            } else {
                    toast.error('Failed to load cart. Please refresh the page.');
                }
                
                this.cart = [];
                this.updateCartCount();
                return;
            }
            
                // Convert Supabase cart data to local cart format
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                this.cart = result.data.map(item => {
                    // Convert Supabase format (product_id, product_name) to UI format (id, name)
                    return {
                        id: item.product_id || item.id,
                        name: item.product_name || item.name,
                        price: item.product_price || item.price,
                        image: item.product_image || item.image,
                        quantity: parseInt(item.quantity) || 1,
                        status: item.status || 'in_stock'
                    };
                });
            } else {
                // Empty cart
                this.cart = [];
            }
            
            // Update UI
            this.updateCartCount();
            
            // Update all product card UIs to reflect the correct quantities from Supabase
            // This ensures product cards show the same quantity as cart and table editor
            this.cart.forEach(item => {
                this.updateProductCardUI(item.id);
            });
            
            // Refresh cart display if on cart page
        if (this.currentView === "cart") {
            this.showCart({ skipHistory: true });
            }
        } catch (error) {
            console.error('Error loading user cart:', error);
            toast.error('Failed to load cart. Please refresh the page.');
            this.cart = [];
            this.updateCartCount();
        }
    }
    showProductDetail(productId, options = {}) {
        const { skipHistory = false } = options;
        // Save current view state before navigating to product detail
        this.previousView = this.currentView;
        this.previousMainCategory = this.currentMainCategory;
        this.currentProductId = productId;
        this.currentView = 'product-detail';
        if (!this._historyInitialized) {
            this.initializeHistory();
        }
        if (!skipHistory) {
            this.pushHistoryState();
        }
        this.render();
    }
    renderProductDetail() {
        const app = document.getElementById('app');
        if (!app) return;

        const product = this.products.find(p => p.id === this.currentProductId);
        if (!product) {
            // Product not found, go back to home
            this.currentView = 'home';
            this.currentProductId = null;
            this.render();
            return;
        }

        const cartItem = this.cart.find(item => item.id === product.id);
        const quantity = cartItem ? cartItem.quantity : 0;
        const stock = product.stock_quantity !== undefined ? product.stock_quantity : product.stock;
        const isOutOfStock = stock === 0 || product.status === 'out_of_stock';

        // Get related products (same category/subcategory, excluding current product)
        const productCategory = product.subcategory || product.category;
        const relatedProducts = this.products
            .filter(p => p.id !== product.id && (p.subcategory === productCategory || p.category === productCategory))
            .slice(0, 8);

        app.innerHTML = `
            <div class="min-h-screen bg-gray-50">
                <!-- Header -->
                <header class="bg-white shadow-sm border-b sticky top-0 z-40">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex items-center justify-between h-16">
                            <!-- Left Section -->
                            <div class="flex items-center">
                                <button id="back-btn" class="flex items-center text-gray-600 hover:text-emerald-600 mr-4">
                                    <i data-lucide="arrow-left" class="w-5 h-5 mr-2"></i>
                                    Back
                                </button>
                                <h1 class="text-xl sm:text-2xl font-bold text-emerald-600">Product Details</h1>
                            </div>
                            
                            <!-- Right Section -->
                            <div class="flex items-center">
                                <button id="cart-btn" class="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors">
                                    <i data-lucide="shopping-cart" class="w-6 h-6"></i>
                                    <span id="cart-count" class="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-all duration-200 ${this.cart.length > 0 ? 'animate-pulse' : ''}">${this.cart.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <!-- Product Detail Section -->
                    <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 p-6 sm:p-8">
                            <!-- Product Image -->
                            <div class="flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden">
                                <img src="${product.image}" alt="${product.name}" class="w-full h-auto max-h-96 object-contain">
                            </div>
                            
                            <!-- Product Info -->
                            <div class="flex flex-col justify-center">
                                <div class="mb-4">
                                    <span class="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full mb-3">
                                        ${productCategory ? productCategory.charAt(0).toUpperCase() + productCategory.slice(1) : 'Product'}
                                    </span>
                                    <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">${product.name}</h1>
                                    <p class="text-lg text-gray-600 mb-6">${product.description || 'Premium quality product'}</p>
                                </div>
                                
                                <div class="mb-6">
                                    <div class="product-price-row flex items-center justify-between mb-4 text-sm sm:text-base">
                                        <span class="text-sm text-gray-500">${product.stock_quantity !== undefined ? `Stock: ${product.stock_quantity}` : ''}</span>
                                        <span class="text-lg font-bold text-emerald-600">${formatCurrency(product.price)}</span>
                                    </div>
                                    
                                    ${isOutOfStock ? `
                                        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <p class="text-red-800 font-medium">Currently Out of Stock</p>
                                        </div>
                                    ` : `
                                        <div class="flex items-center space-x-4 mb-6" data-product-action="${product.id}">
                                            <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${product.id}">
                                                Add to Cart
                                            </button>
                                            <template data-template="add">
                                                <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${product.id}">
                                                    Add to Cart
                                                </button>
                                            </template>
                                            <template data-template="quantity">
                                                <div class="flex items-center space-x-4 flex-1">
                                                    <button class="quantity-btn w-14 h-14 md:w-12 md:h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                            data-product-id="${product.id}" data-action="decrease">
                                                        <i data-lucide="minus" class="w-6 h-6 md:w-5 md:h-5"></i>
                                                    </button>
                                                    <span class="quantity-display font-bold text-2xl text-gray-900 min-w-[3rem] text-center" data-product-quantity="${product.id}">${quantity}</span>
                                                    <button class="quantity-btn w-14 h-14 md:w-12 md:h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                            data-product-id="${product.id}" data-action="increase">
                                                        <i data-lucide="plus" class="w-6 h-6 md:w-5 md:h-5"></i>
                                                    </button>
                                                </div>
                                            </template>
                                            ${quantity === 0 ? `
                                                <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${product.id}">
                                                    Add to Cart
                                                </button>
                                            ` : `
                                                <div class="flex items-center space-x-4 flex-1">
                                                    <button class="quantity-btn w-14 h-14 md:w-12 md:h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                            data-product-id="${product.id}" data-action="decrease">
                                                        <i data-lucide="minus" class="w-6 h-6 md:w-5 md:h-5"></i>
                                                    </button>
                                                    <span class="quantity-display font-bold text-2xl text-gray-900 min-w-[3rem] text-center" data-product-quantity="${product.id}">${quantity}</span>
                                                    <button class="quantity-btn w-14 h-14 md:w-12 md:h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                            data-product-id="${product.id}" data-action="increase">
                                                        <i data-lucide="plus" class="w-6 h-6 md:w-5 md:h-5"></i>
                                                    </button>
                                                </div>
                                            `}
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Related Products Section -->
                    ${relatedProducts.length > 0 ? `
                        <div class="mb-8">
                            <h2 class="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
                            <div class="relevant-products-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                ${relatedProducts.map(relatedProduct => {
                                    const relatedCartItem = this.cart.find(item => item.id === relatedProduct.id);
                                    const relatedQuantity = relatedCartItem ? relatedCartItem.quantity : 0;
                                    const relatedStock = relatedProduct.stock_quantity !== undefined ? relatedProduct.stock_quantity : relatedProduct.stock;
                                    const relatedIsOutOfStock = relatedStock === 0 || relatedProduct.status === 'out_of_stock';
                                    
                                    return `
                                        <div class="product-card cursor-pointer bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden" data-product-id="${relatedProduct.id}" data-product-clickable="true">
                                            <div class="product-image-container">
                                                <img src="${relatedProduct.image}" alt="${relatedProduct.name}" class="w-full h-48 object-cover">
                                            </div>
                                            <div class="p-4">
                                                <h3 class="text-base font-semibold text-gray-900 mb-1 line-clamp-2">${relatedProduct.name}</h3>
                                                <p class="text-sm text-gray-600 mb-2 line-clamp-1">${relatedProduct.description || ''}</p>
                                                <div class="product-price-display">
                                                    <span class="product-price-amount">${formatCurrency(relatedProduct.price)}</span>
                                                    <span class="product-price-stock">${relatedProduct.stock_quantity !== undefined ? `Stock: ${relatedProduct.stock_quantity}` : ''}</span>
                                                </div>
                                            <div class="w-full space-y-2" data-product-action="${relatedProduct.id}">
                                                <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${relatedProduct.id}">
                                                    Add to Cart
                                                </button>
                                                <template data-template="add">
                                                    <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${relatedProduct.id}">
                                                        Add to Cart
                                                    </button>
                                                </template>
                                                <template data-template="quantity">
                                                    <div class="flex items-center justify-center space-x-2">
                                                        <button class="quantity-btn w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                                data-product-id="${relatedProduct.id}" data-action="decrease">
                                                            <i data-lucide="minus" class="w-4 h-4"></i>
                                                        </button>
                                                        <span class="quantity-display font-semibold text-gray-900 min-w-[2rem] text-center text-sm" data-product-quantity="${relatedProduct.id}">${relatedQuantity}</span>
                                                        <button class="quantity-btn w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                                data-product-id="${relatedProduct.id}" data-action="increase">
                                                            <i data-lucide="plus" class="w-4 h-4"></i>
                                                        </button>
                                                    </div>
                                                </template>
                                                ${relatedIsOutOfStock ? `
                                                    <button class="w-full btn btn-outline cursor-not-allowed opacity-50 text-sm py-2" disabled>
                                                        Out of Stock
                                                    </button>
                                                ` : relatedQuantity === 0 ? `
                                                    <button class="add-to-cart-btn w-full btn btn-primary text-sm py-2" data-product-id="${relatedProduct.id}">
                                                        Add to Cart
                                                    </button>
                                                ` : `
                                                    <div class="flex items-center justify-center space-x-2">
                                                        <button class="quantity-btn w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                                data-product-id="${relatedProduct.id}" data-action="decrease">
                                                            <i data-lucide="minus" class="w-4 h-4"></i>
                                                        </button>
                                                        <span class="quantity-display font-semibold text-gray-900 min-w-[2rem] text-center text-sm" data-product-quantity="${relatedProduct.id}">${relatedQuantity}</span>
                                                        <button class="quantity-btn w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                                data-product-id="${relatedProduct.id}" data-action="increase">
                                                            <i data-lucide="plus" class="w-4 h-4"></i>
                                                        </button>
                                                    </div>
                                                `}
                                            </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </main>
            </div>
        `;

        initIcons();
        this.attachProductDetailEventListeners();
        this.updateProductCardUI(product.id);
        relatedProducts.forEach(rp => this.updateProductCardUI(rp.id));
        this.attachEventListeners();
        this.saveViewState();
    }

    attachProductDetailEventListeners() {
        // Back button - return to previous view
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                const fallback = () => {
                    this.currentView = this.previousView || 'home';
                    this.currentMainCategory = this.previousMainCategory;
                    this.currentProductId = null;
                    this.render();
                    this.pushHistoryState({ replace: true });
                };
                this.safeGoBack(fallback);
            });
        }

        // Cart button
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', async () => {
                await this.showCart();
            });
        }

        // Product card click listeners for related products
        document.querySelectorAll('[data-product-clickable="true"]').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('.add-to-cart-btn') || e.target.closest('.quantity-btn')) {
                    return;
                }
                const productId = card.dataset.productId;
                if (productId) {
                    this.showProductDetail(productId);
                }
            });
        });

        // Use existing event delegation for add-to-cart and quantity buttons
        // They're already handled globally in attachEventListeners()
    }

    async removeFromCart(productId) {
        const currentUser = this.authManager.getUser();
        
        if (!currentUser) {
            toast.error('Please login to manage your cart');
            return;
        }
        
                const userId = currentUser.id || currentUser.user_metadata?.id;
        if (!userId) {
            toast.error('User session error. Please login again.');
            return;
        }
        
                    // Validate user ID is a valid UUID
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(String(userId).trim())) {
            toast.error('Invalid user session. Please login again.');
            return;
        }
        
        const existingItem = this.cart.find(item => String(item.id) === String(productId));
        const previousCart = [...this.cart];

        try {
            if (!existingItem) {
                const result = await this.authManager.updateUserCartItem(userId, productId, 0);
                if (result.error) {
                    throw result.error;
                }
                await this.loadUserCart();
                return;
            }

            this.cart = this.cart.filter(item => String(item.id) !== String(productId));

            this.updateCartCount();
            this.updateProductCardUI(productId);

            if (this.currentView === "cart") {
                this.showCart({ skipHistory: true });
            }

            toast.success('Item removed from cart');

            const result = await this.authManager.updateUserCartItem(userId, productId, 0);
            if (result.error) {
                throw result.error;
            }
        } catch (error) {
            console.error('Cart remove error:', error);
            toast.error(error.message || 'Failed to remove item from cart');

            this.cart = previousCart;
            this.updateCartCount();
            this.updateProductCardUI(productId);
            if (this.currentView === 'cart') {
                this.showCart({ skipHistory: true });
            }

            await this.loadUserCart();
        }
    }
    async updateCartQuantity(productId, quantity) {
        // Prevent duplicate clicks - if this product is already being processed, ignore
        const processingKey = `update_${productId}`;
        if (this.processingCart.has(processingKey)) {
            return;
        }
        
        const currentUser = this.authManager.getUser();
        
        if (!currentUser) {
            toast.error('Please login to manage your cart');
            return;
        }
        
                const userId = currentUser.id || currentUser.user_metadata?.id;
        if (!userId) {
            toast.error('User session error. Please login again.');
            return;
        }
        
                    // Validate user ID is a valid UUID
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (!uuidRegex.test(String(userId).trim())) {
                        toast.error('Invalid user session. Please login again.');
                        return;
                    }
        
        // Mark this product as being processed
        this.processingCart.add(processingKey);
                    
                    // If quantity is 0 or less, remove the item
                    if (quantity <= 0) {
                        await this.removeFromCart(productId);
            this.processingCart.delete(processingKey);
                        return;
                    }
        
        try {
            // OPTIMISTIC UPDATE: Update local cart immediately
            const cartItem = this.cart.find(item => String(item.id) === String(productId));
            if (cartItem) {
                cartItem.quantity = quantity;
            }
            
            // Update UI immediately
            this.updateCartCount();
            this.updateProductCardUI(productId);
                    
                    // Update in Supabase
                    const result = await this.authManager.updateUserCartItem(userId, productId, quantity);
                    if (result.error) {
                // Check if it's a table access error (406)
                if (result.error.isTableError || result.error.status === 406 || result.error.statusCode === 406) {
                    toast.error('Cart table not set up. Please run create_user_carts_table.sql in Supabase SQL Editor.', 10000);
                } else {
                    toast.error('Failed to update cart item. Please try again.');
                }
                
                // Only reload from Supabase on error to sync
                await this.loadUserCart();
            } else {
                // On success, update local cart with Supabase response
                if (result.data) {
                    const updatedItem = result.data[0] || result.data;
                    const cartItem = this.cart.find(item => String(item.id) === String(productId));
                    if (cartItem) {
                        // Use the exact quantity from Supabase to ensure sync
                        cartItem.quantity = parseInt(updatedItem.quantity) || quantity;
                    }
                    // Update both cart count and product card UI to reflect Supabase quantity
            this.updateCartCount();
                    this.updateProductCardUI(productId);
                }
            }
        } catch (error) {
            console.error('Cart update error:', error);
            toast.error('Failed to update cart item');
            // Reload from Supabase to sync on error
            await this.loadUserCart();
        } finally {
            // Remove from processing set when done
            this.processingCart.delete(processingKey);
        }
    }

    async placeOrder() {
        console.log('🟠 PLACE ORDER STARTED');
        
        if (this.cart.length === 0) {
            console.log('❌ Cart is empty');
            toast.error('Your cart is empty');
            return;
        }

        console.log(`📦 Cart has ${this.cart.length} items`);

        // Get the first product ID from cart for product_id field
        const firstProductId = this.cart.length > 0 ? this.cart[0].id : null;
        console.log(`📝 First product ID: ${firstProductId}`);

        const user = this.authManager.getUser();
        console.log(`👤 User: ${user.email}`);
        
        const order = {
            customer_name: user.user_metadata?.name || user.name || 'Customer',
            customer_email: user.email || null,
            customer_mobile: user.user_metadata?.mobile || user.mobile || null,
            customer_address: '123 Main St, City, State 12345',
            customer_landmark: 'Near Main Street',
            customer_pincode: '123456',
            items: [...this.cart],
            product_id: firstProductId,
            total_amount: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'pending',
            payment_status: 'pending',
            created_at: new Date().toISOString(),
            delivery_status: 'pending'
        };

        console.log('💾 Order object prepared:', order);

        try {
            console.log('📤 Creating order in Supabase...');
            const { data, error } = await db.createOrder(order);
            
            if (error) {
                console.error('❌ Order creation failed:', error);
                throw new Error('Failed to save order: ' + error.message);
            }
            
            console.log('✅ Order created successfully:', data);
            console.log(`🎯 NOW REDUCING STOCK - Cart items: ${JSON.stringify(this.cart)}`);
            
            // REDUCE STOCK - CRITICAL STEP
            await this.reduceProductStock(this.cart);
            
            console.log('✅ Stock reduction completed');
            
            // Clear cart from Supabase
            console.log('🧹 Clearing cart...');
            const currentUser = this.authManager.getUser();
            if (currentUser) {
                const userId = currentUser.id || currentUser.user_metadata?.id;
                if (userId) {
                    try {
                        await this.authManager.clearUserCart(userId);
                        await this.loadUserCart();
                        console.log('✅ Cart cleared');
                    } catch (cartError) {
                        console.error('⚠️ Error clearing cart:', cartError);
                    }
                }
            }
            
            console.log('🎉 Order placed successfully - reloading data...');
            toast.success('Order placed successfully!');
            await this.loadData();
            this.render();
            console.log('🟢 ORDER FLOW COMPLETE');
        } catch (error) {
            console.error('❌ CRITICAL ERROR in placeOrder:', error);
            console.error('Stack:', error.stack);
            toast.error('Failed to place order: ' + error.message);
        }
    }

    async reduceProductStock(cartItems) {
        console.log('🔴🔴🔴 REDUCE STOCK FUNCTION CALLED 🔴🔴🔴');
        console.log('Cart items:', cartItems);
        
        if (!supabase || !supabaseReady) {
            console.error('❌❌❌ SUPABASE NOT READY ❌❌❌');
            return;
        }

        for (const item of cartItems) {
            try {
                console.log(`\n===== UPDATING PRODUCT: ${item.id} =====`);
                console.log(`Current stock in cart: ${item.quantity}`);
                
                // Step 1: Fetch current stock
                const { data: product, error: fetchErr } = await supabase
                    .from('products')
                    .select('id, name, stock_quantity')
                    .eq('id', item.id)
                    .single();

                if (fetchErr) {
                    console.error(`❌ Fetch failed:`, fetchErr);
                    continue;
                }

                console.log(`Current stock in DB: ${product.stock_quantity}`);
                
                // Step 2: Calculate new stock
                const newStock = Math.max(0, product.stock_quantity - item.quantity);
                console.log(`New stock will be: ${newStock}`);
                
                // Step 3: UPDATE directly - SIMPLE AND DIRECT
                const { data: updateResult, error: updateErr } = await supabase
                    .from('products')
                    .update({ 
                        stock_quantity: newStock,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', item.id)
                    .select();

                if (updateErr) {
                    console.error(`❌❌❌ UPDATE FAILED ❌❌❌`, updateErr);
                } else {
                    console.log(`✅✅✅ UPDATE SUCCESS ✅✅✅`);
                    console.log('Updated data:', updateResult);
                }
                
                // Step 4: Verify it was updated
                const { data: verify } = await supabase
                    .from('products')
                    .select('id, stock_quantity')
                    .eq('id', item.id)
                    .single();
                    
                console.log(`VERIFICATION - New stock in DB: ${verify.stock_quantity}`);
                
            } catch (err) {
                console.error(`❌ Exception for ${item.id}:`, err);
            }
        }
        
        console.log('🔴🔴🔴 STOCK REDUCTION COMPLETE 🔴🔴🔴\n');
    }

    render() {
        const app = document.getElementById('app');
        
        if (this.currentView === 'category') {
            this.renderCategoryPage();
        } else if (this.currentView === 'product-detail' && this.currentProductId) {
            this.renderProductDetail();
        } else {
            // Always render home page - it will show search results if searchQuery exists
            this.renderHomePage();
        }
    }
    renderHomePage() {
        const app = document.getElementById('app');
        
        if (!app) {
            console.error('App element not found');
            return;
        }

        // Debug: Log current products
        console.log('renderHomePage - Products available:', this.products.length);
        console.log('renderHomePage - Current view:', this.currentView);
        
        app.innerHTML = `
            <div class="min-h-screen bg-gray-50">
                <!-- Header -->
                <header class="bg-white shadow-sm border-b sticky top-0 z-40">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="relative flex items-center justify-center h-16">
                            <button id="hamburger-btn" class="absolute left-0 p-2 text-gray-600 hover:text-emerald-600 transition-colors">
                                    <i data-lucide="menu" class="w-6 h-6"></i>
                                </button>
                            <div class="flex items-center">
                                    <h1 class="text-2xl font-bold text-emerald-600">Mango Mart</h1>
                                </div>
                            <div class="absolute right-0 flex items-center">
                                <button id="cart-btn" class="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors">
                                    <i data-lucide="shopping-cart" class="w-6 h-6"></i>
                                    <span id="cart-count" class="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-all duration-200 ${this.cart.length > 0 ? 'animate-pulse' : ''}">${this.cart.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Search Bar Section -->
                <div class="search-bar-container sticky top-16 z-30">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div class="search-input-wrapper">
                            <input type="text" id="search-input" placeholder='Search for "fruits and vegetables"' 
                                class="text-base" value="${this.searchQuery || ''}">
                            <span class="search-placeholder-rotator" aria-hidden="true">
                                <span class="search-placeholder-label">Search for "</span>
                                <span class="search-placeholder-dynamic">
                                    <span class="search-placeholder-item">fruits&nbsp;and&nbsp;vegetables"</span>
                                    <span class="search-placeholder-item">grocery"</span>
                                    <span class="search-placeholder-item">stationery"</span>
                                </span>
                            </span>
                            <i data-lucide="search" class="search-icon"></i>
                        </div>
                        <!-- Animated Delivery Headline -->
                        <div class="mt-3 overflow-hidden">
                            <div class="delivery-headline-container">
                                <div class="delivery-headline-text">
                                    <span class="inline-flex items-center">
                                        <i data-lucide="truck" class="w-5 h-5"></i>
                                        <span>⚡ 15–30 Minute Express Delivery</span>
                                        <i data-lucide="zap" class="w-5 h-5"></i>
                                    </span>
                                    <span class="inline-flex items-center">
                                        <i data-lucide="truck" class="w-5 h-5"></i>
                                        <span>⚡ 15–30 Minute Express Delivery</span>
                                        <i data-lucide="zap" class="w-5 h-5"></i>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Mobile Menu Overlay -->
                <div id="mobile-menu" class="fixed inset-0 z-50 hidden">
                    <div class="fixed inset-0 bg-black bg-opacity-25" id="menu-overlay"></div>
                    <div class="absolute top-16 left-1/2 w-full max-w-7xl px-4 sm:px-6 lg:px-8 transform -translate-x-1/2">
                        <div class="bg-white rounded-b-2xl shadow-2xl overflow-hidden transform -translate-y-full transition-transform duration-300 ease-out h-1/2 max-h-[calc(100vh-64px)] flex flex-col" id="menu-panel">
                        <div class="flex items-center justify-between p-4 border-b">
                            <h2 class="text-xl font-semibold text-gray-900">Menu</h2>
                            <button id="close-menu-btn" class="p-2 text-gray-600 hover:text-emerald-600">
                                <i data-lucide="x" class="w-6 h-6"></i>
                            </button>
                        </div>
                            <nav class="p-4 flex-1 overflow-y-auto">
                            <ul class="space-y-2">
                                <li>
                                    <a href="orders.html" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                        <i data-lucide="package" class="w-5 h-5 mr-3"></i>
                                        Your Orders
                                    </a>
                                </li>
                                <li>
                                    <a href="about.html" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                        <i data-lucide="info" class="w-5 h-5 mr-3"></i>
                                        About Us
                                    </a>
                                </li>
                                <li>
                                    <a href="contact.html" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                        <i data-lucide="phone" class="w-5 h-5 mr-3"></i>
                                        Contact Us
                                    </a>
                                </li>
                                <li>
                                    <a href="privacy.html" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                        <i data-lucide="shield-check" class="w-5 h-5 mr-3"></i>
                                        Privacy Policy
                                    </a>
                                </li>
                                <li>
                                    <a href="shipping.html" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                        <i data-lucide="truck" class="w-5 h-5 mr-3"></i>
                                        Shipping Policy
                                    </a>
                                </li>
                                <li class="border-t pt-2 mt-4">
                                    <button id="logout-btn" class="flex items-center w-full p-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors">
                                        <i data-lucide="log-out" class="w-5 h-5 mr-3"></i>
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        </nav>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    ${this.searchQuery && this.searchQuery.trim() ? `
                        <div class="mb-6 flex items-center justify-between">
                            <h2 class="text-2xl font-bold text-gray-900">Results for "${this.searchQuery.replace(/[`$]/g,'') }"</h2>
                            <button id="clear-search" class="text-sm text-gray-600 hover:text-gray-800">Clear</button>
                        </div>
                        <div class="search-results-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            ${this.getSearchResults().map(product => `
                                <div class="product-card h-full flex flex-col cursor-pointer" data-product-id="${product.id}" data-product-clickable="true">
                                    <div class="product-image-container">
                                        <img src="${product.image}" alt="${product.name}">
                                    </div>
                                    <div class="p-4 flex flex-col h-full">
                                        <h3 class="text-lg font-semibold text-gray-900 mb-2">${product.name}</h3>
                                        <p class="text-sm text-gray-600 mb-3" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${product.description || ''}</p>
                                        <div class="mt-auto space-y-3">
                                            <div class="product-price-display">
                                                <span class="product-price-amount">${formatCurrency(product.price)}</span>
                                                <span class="product-price-stock">${product.stock_quantity !== undefined ? `Stock: ${product.stock_quantity}` : ''}</span>
                                            </div>
                                            <div class="product-action" data-product-action="${product.id}">
                                                <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${product.id}">
                                                    Add to Cart
                                                </button>
                                                <template data-template="add">
                                                    <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${product.id}">
                                                        Add to Cart
                                                    </button>
                                                </template>
                                                <template data-template="quantity">
                                                    <div class="flex items-center justify-between gap-3">
                                                        <button class="quantity-btn w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                                data-product-id="${product.id}" data-action="decrease">
                                                            <i data-lucide="minus" class="w-5 h-5 sm:w-4 sm:h-4"></i>
                                                        </button>
                                                        <span class="quantity-display font-semibold text-gray-900 min-w-[2.5rem] text-center text-lg sm:text-base" data-product-quantity="${product.id}">${(this.cart.find(item => item.id === product.id)?.quantity) || 0}</span>
                                                        <button class="quantity-btn w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                                data-product-id="${product.id}" data-action="increase">
                                                            <i data-lucide="plus" class="w-5 h-5 sm:w-4 sm:h-4"></i>
                                                        </button>
                                                    </div>
                                                </template>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                    <!-- Welcome Section -->
                    <div class="text-center py-12 mb-12">
                        <h2 class="text-4xl font-bold text-gray-900 mb-4">Welcome to Mango Mart</h2>
                        <p class="text-xl text-gray-600 mb-8">Choose a category below to start shopping</p>
                        <div class="flex justify-center space-x-8">
                            <div class="text-center">
                                <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <i data-lucide="truck" class="w-10 h-10 text-emerald-600"></i>
                                </div>
                                <p class="text-sm font-medium text-gray-700">Fast Delivery</p>
                            </div>
                            <div class="text-center">
                                <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <i data-lucide="shield-check" class="w-10 h-10 text-blue-600"></i>
                                </div>
                                <p class="text-sm font-medium text-gray-700">Quality Assured</p>
                            </div>
                            <div class="text-center">
                                <div class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <i data-lucide="credit-card" class="w-10 h-10 text-orange-600"></i>
                                </div>
                                <p class="text-sm font-medium text-gray-700">Easy Payment</p>
                            </div>
                        </div>
                    </div>

                    <!-- Categories Section -->
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Shop by Category</h2>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                            ${mainCategories.map(category => {
                                const categoryProducts = this.products.filter(p => category.subcategories.includes(p.subcategory || p.category));
                                const sanitizeText = (value = '') => String(value)
                                    .replace(/&/g, '&amp;')
                                    .replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;')
                                    .replace(/"/g, '&quot;')
                                    .replace(/'/g, '&#39;');
                                const encodeImage = (value = '') => encodeURI(String(value)).replace(/'/g, '%27');
                                const topProducts = categoryProducts.slice(0, 5);
                                const productMarquee = (() => {
                                    if (!topProducts.length) return '';
                                    const marqueeProducts = [...topProducts, ...topProducts];
                                    const chips = marqueeProducts.map((product, idx) => {
                                        const safeName = sanitizeText(product?.name || 'Featured item');
                                        const imageUrl = product?.image ? encodeImage(product.image) : '';
                                        const avatar = imageUrl
                                            ? `<span class="category-chip-avatar" style="background-image:url('${imageUrl}')"></span>`
                                            : `<span class="category-chip-avatar category-chip-avatar--fallback"><i data-lucide="${category.icon}" class="w-4 h-4"></i></span>`;
                                        return `<div class="category-product-chip" data-product-marquee-index="${idx}">${avatar}<span>${safeName}</span></div>`;
                                    }).join('');
                                    return `<div class="category-product-strip"><div class="category-product-track">${chips}</div></div>`;
                                })();
                                return `
                                        <div class="main-category-card bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer" 
                                             data-category="${category.id}" style="min-height: 320px; height: auto;">
                                            <div class="h-full min-h-[320px] bg-gradient-to-br ${category.color} p-8 flex flex-col justify-between text-white relative">
                                                <div class="absolute inset-0 opacity-15">
                                                    <div class="absolute top-4 right-4 w-40 h-40 rounded-full bg-white blur-2xl"></div>
                                                    <div class="absolute bottom-4 left-4 w-32 h-32 rounded-full bg-white blur-xl"></div>
                                                    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white blur-lg"></div>
                                            </div>
                                            <div class="relative z-10">
                                                    <div class="flex items-center justify-between mb-6">
                                                        <div class="p-3 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                                                            <i data-lucide="${category.icon}" class="w-10 h-10"></i>
                                                        </div>
                                                        <span class="category-highlight-pill">
                                                            Explore
                                                    </span>
                                                </div>
                                                    <h3 class="text-3xl font-bold mb-3 drop-shadow-lg">${category.name}</h3>
                                                    <p class="text-white text-opacity-95 mb-6 text-lg font-medium">${category.description}</p>
                                                <div class="flex flex-wrap gap-2">
                                                    ${category.subcategories.map(sub => {
                                                        const subcat = sampleCategories.find(c => c.id === sub);
                                                        return subcat ? `
                                                                <span class="text-xs font-medium bg-white bg-opacity-25 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white border-opacity-30">
                                                                ${subcat.name}
                                                            </span>
                                                        ` : '';
                                                    }).join('')}
                                                </div>
                                                    ${productMarquee}
                                            </div>
                                                <div class="relative z-10 flex justify-end items-center">
                                                    <div class="p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full border border-white border-opacity-30">
                                                        <i data-lucide="arrow-right" class="w-5 h-5"></i>
                                                    </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    `}
                </main>

                <!-- Footer -->
                <footer class="bg-gray-900 text-white py-8 mt-16">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex flex-col md:flex-row justify-between items-center">
                            <!-- Copyright -->
                            <div class="text-center md:text-left mb-4 md:mb-0">
                                <p class="text-gray-400">&copy; 2024 Mango Mart. All rights reserved.</p>
                            </div>
                            
                            <!-- Social Media Links -->
                            <div class="flex space-x-6">
                                <a href="https://www.instagram.com/mangomart_srinivaspura?igsh=MXZ4NGZnM3owaXdkaw==" target="_blank" rel="noopener noreferrer" class="text-gray-400 social-instagram transition-colors duration-200" title="Follow us on Instagram">
                                    <i data-lucide="instagram" class="w-6 h-6"></i>
                                </a>
                                <a href="https://www.facebook.com/mangomartonline.2025?mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" class="text-gray-400 social-facebook transition-colors duration-200" title="Follow us on Facebook">
                                    <i data-lucide="facebook" class="w-6 h-6"></i>
                                </a>
                                <a href="https://wa.me/918748922362" target="_blank" rel="noopener noreferrer" class="text-gray-400 social-whatsapp transition-colors duration-200" title="Chat with us on WhatsApp">
                                    <i data-lucide="message-circle" class="w-6 h-6"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        `;

        initIcons();
        this.attachEventListeners();
        this.saveViewState();
    }

    renderSearchResults() {
        const app = document.getElementById('app');
        const searchResults = this.getSearchResults();
        const relevantProducts = this.getRelevantProducts();
        
        app.innerHTML = `
            <div class="min-h-screen bg-gray-50">
                <!-- Header -->
                <header class="bg-white shadow-sm border-b">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex items-center h-16">
                            <!-- Left Section -->
                            <div class="flex items-center">
                                <!-- Hamburger Menu Button -->
                                <button id="hamburger-btn" class="p-2 text-gray-600 hover:text-emerald-600 transition-colors mr-4">
                                    <i data-lucide="menu" class="w-6 h-6"></i>
                                </button>
                                <div class="flex-shrink-0">
                                    <h1 class="text-2xl font-bold text-emerald-600">Mango Mart</h1>
                                </div>
                            </div>
                            
                            <!-- Center Section (kept consistent with home) -->
                            <div class="flex-1"></div>
                            
                            <!-- Right Section -->
                            <div class="flex items-center">
                                <button id="cart-btn" class="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors">
                                    <i data-lucide="shopping-cart" class="w-6 h-6"></i>
                                    <span id="cart-count" class="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-all duration-200 ${this.cart.length > 0 ? 'animate-pulse' : ''}">${this.cart.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Search Bar Section (same as home) -->
                <div class="search-bar-container sticky top-16 z-30">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div class="search-input-wrapper">
                            <input type="text" id="search-input" placeholder="Search for products..." 
                                class="text-base" value="${this.searchQuery}">
                            <i data-lucide="search" class="search-icon"></i>
                        </div>
                    </div>
                </div>

                <!-- Mobile Menu Overlay -->
                <div id="mobile-menu" class="fixed inset-0 z-50 hidden">
                    <div class="fixed inset-0 bg-black bg-opacity-25" id="menu-overlay"></div>
                    <div class="absolute top-16 left-1/2 w-full max-w-7xl px-4 sm:px-6 lg:px-8 transform -translate-x-1/2">
                        <div class="bg-white rounded-b-2xl shadow-2xl overflow-hidden transform -translate-y-full transition-transform duration-300 ease-out h-1/2 max-h-[calc(100vh-64px)] flex flex-col" id="menu-panel">
                        <div class="flex items-center justify-between p-4 border-b">
                            <h2 class="text-xl font-semibold text-gray-900">Menu</h2>
                            <button id="close-menu-btn" class="p-2 text-gray-600 hover:text-emerald-600">
                                <i data-lucide="x" class="w-6 h-6"></i>
                            </button>
                        </div>
                            <nav class="p-4 flex-1 overflow-y-auto">
                            <ul class="space-y-2">
                                <li>
                                    <a href="orders.html" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                        <i data-lucide="package" class="w-5 h-5 mr-3"></i>
                                        Your Orders
                                    </a>
                                </li>
                                <li>
                                    <a href="about.html" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                        <i data-lucide="info" class="w-5 h-5 mr-3"></i>
                                        About Us
                                    </a>
                                </li>
                                <li>
                                    <a href="contact.html" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                        <i data-lucide="phone" class="w-5 h-5 mr-3"></i>
                                        Contact Us
                                    </a>
                                </li>
                                <li>
                                    <a href="privacy.html" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                        <i data-lucide="shield-check" class="w-5 h-5 mr-3"></i>
                                        Privacy Policy
                                    </a>
                                </li>
                                <li>
                                    <a href="shipping.html" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                        <i data-lucide="truck" class="w-5 h-5 mr-3"></i>
                                        Shipping Policy
                                    </a>
                                </li>
                                <li class="border-t pt-2 mt-4">
                                    <button id="logout-btn" class="flex items-center w-full p-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors">
                                        <i data-lucide="log-out" class="w-5 h-5 mr-3"></i>
                                        Logout
                                    </button>
                                </li>
                            </ul>
                        </nav>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <!-- Search Header -->
                    <div class="mb-8">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h2 class="text-2xl font-bold text-gray-900">Search Results</h2>
                                <p class="text-gray-600">Found ${searchResults.length} results for "${this.searchQuery}"</p>
                            </div>
                            <button id="back-to-home" class="flex items-center text-gray-600 hover:text-emerald-600">
                                <i data-lucide="arrow-left" class="w-5 h-5 mr-2"></i>
                                Back to Home
                            </button>
                        </div>
                    </div>

                    <!-- Search Results -->
                    ${searchResults.length > 0 ? `
                        <div class="mb-12">
                            <h3 class="text-lg font-semibold text-gray-900 mb-6">Exact Matches</h3>
                            <div class="search-results-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                ${searchResults.map(product => {
                                    const cartItem = this.cart.find(item => item.id === product.id);
                                    const quantity = cartItem ? cartItem.quantity : 0;
                                    
                                    return `
                                        <div class="product-card h-full flex flex-col cursor-pointer" data-product-id="${product.id}" data-product-clickable="true">
                                            <div class="product-image-container"><img src="${product.image}" alt="${product.name}"></div>
                                            <div class="p-4 flex flex-col h-full">
                                                <h3 class="font-semibold text-gray-900 mb-2">${product.name}</h3>
                                                <p class="text-gray-600 text-sm mb-3" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${product.description || ''}</p>
                                                <div class="mt-auto space-y-3">
                                                    <div class="product-price-display">
                                                        <span class="product-price-amount">${formatCurrency(product.price)}</span>
                                                        <span class="product-price-stock">${product.stock_quantity !== undefined ? `Stock: ${product.stock_quantity}` : ''}</span>
                                                    </div>
                                                    <div class="product-action" data-product-action="${product.id}">
                                                        <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${product.id}">
                                                            Add to Cart
                                                        </button>
                                                        <template data-template="add">
                                                            <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${product.id}">
                                                                Add to Cart
                                                            </button>
                                                        </template>
                                                        <template data-template="quantity">
                                                            <div class="flex items-center justify-between gap-3">
                                                                <button class="quantity-btn w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                                data-product-id="${product.id}" data-action="decrease">
                                                                    <i data-lucide="minus" class="w-5 h-5 sm:w-4 sm:h-4"></i>
                                                        </button>
                                                                <span class="quantity-display font-semibold text-gray-900 min-w-[2.5rem] text-center text-lg sm:text-base" data-product-quantity="${product.id}">${quantity}</span>
                                                                <button class="quantity-btn w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                                data-product-id="${product.id}" data-action="increase">
                                                                    <i data-lucide="plus" class="w-5 h-5 sm:w-4 sm:h-4"></i>
                                                        </button>
                                                    </div>
                                                        </template>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Relevant Products -->
                    ${relevantProducts.length > 0 ? `
                        <div class="mb-8">
                            <h3 class="text-lg font-semibold text-gray-900 mb-6">You might also like</h3>
                            <div class="relevant-products-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                ${relevantProducts.map(product => {
                                    const cartItem = this.cart.find(item => item.id === product.id);
                                    const quantity = cartItem ? cartItem.quantity : 0;
                                    
                                    return `
                                        <div class="product-card h-full flex flex-col cursor-pointer" data-product-id="${product.id}" data-product-clickable="true">
                                            <div class="product-image-container"><img src="${product.image}" alt="${product.name}"></div>
                                            <div class="p-4 flex flex-col h-full">
                                                <h3 class="font-semibold text-gray-900 mb-2">${product.name}</h3>
                                                <p class="text-gray-600 text-sm mb-3" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${product.description || ''}</p>
                                                <div class="mt-auto space-y-3">
                                                    <div class="product-price-display">
                                                        <span class="product-price-amount">${formatCurrency(product.price)}</span>
                                                        <span class="product-price-stock">${product.stock_quantity !== undefined ? `Stock: ${product.stock_quantity}` : ''}</span>
                                                    </div>
                                                    <div class="product-action" data-product-action="${product.id}">
                                                        <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${product.id}">
                                                            Add to Cart
                                                        </button>
                                                        <template data-template="add">
                                                            <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${product.id}">
                                                                Add to Cart
                                                            </button>
                                                        </template>
                                                        <template data-template="quantity">
                                                            <div class="flex items-center justify-between gap-3">
                                                                <button class="quantity-btn w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                                data-product-id="${product.id}" data-action="decrease">
                                                                    <i data-lucide="minus" class="w-5 h-5 sm:w-4 sm:h-4"></i>
                                                        </button>
                                                                <span class="quantity-display font-semibold text-gray-900 min-w-[2.5rem] text-center text-lg sm:text-base" data-product-quantity="${product.id}">${quantity}</span>
                                                                <button class="quantity-btn w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                                data-product-id="${product.id}" data-action="increase">
                                                                    <i data-lucide="plus" class="w-5 h-5 sm:w-4 sm:h-4"></i>
                                                        </button>
                                                    </div>
                                                        </template>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${searchResults.length === 0 && relevantProducts.length === 0 ? `
                        <div class="text-center py-12">
                            <i data-lucide="search" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                            <p class="text-gray-500 mb-6">Try searching with different keywords</p>
                            <button id="clear-search" class="btn btn-primary">Clear Search</button>
                        </div>
                    ` : ''}
                </main>
            </div>
        `;

        initIcons();
        this.attachEventListeners();
        this.saveViewState();

        searchResults.forEach(product => {
            this.updateProductCardUI(product.id);
        });
        relevantProducts.forEach(product => {
            this.updateProductCardUI(product.id);
        });
    }
    renderOrdersPage() {
        const user = storage.get('user');
        const orders = storage.get('orders') || [];
        const userOrders = orders
            .filter(order => order.customerId === user.id)
            .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));

        const activeOrders = userOrders.filter(order => {
            const status = (order.status || '').toLowerCase();
            return !['delivered', 'cancelled'].includes(status);
        });

        const completedOrders = userOrders.filter(order => {
            const status = (order.status || '').toLowerCase();
            return ['delivered', 'cancelled'].includes(status);
        });

        const orderStats = {
            total: userOrders.length,
            active: activeOrders.length,
            delivered: completedOrders.filter(o => (o.status || '').toLowerCase() === 'delivered').length,
            cod: userOrders.filter(order => {
                const paymentStatus = (order.payment_status || order.paymentStatus || '').toString().toLowerCase();
                const legacyMethod = (order.paymentMethod || order.payment_method || '').toString().toLowerCase();
                const isPaid = paymentStatus === 'paid' || legacyMethod === 'online';
                return !isPaid;
            }).length
        };
        
        document.getElementById('app').innerHTML = `
            <div class="customer-orders min-h-screen bg-gray-50">
            <!-- Header -->
            <header class="bg-white shadow-sm border-b">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex items-center h-16">
                        <!-- Left Section -->
                        <div class="flex items-center">
                            <!-- Hamburger Menu Button -->
                            <button id="hamburger-btn" class="p-2 text-gray-600 hover:text-emerald-600 transition-colors mr-4">
                                <i data-lucide="menu" class="w-6 h-6"></i>
                            </button>
                            <div class="flex-shrink-0">
                                <h1 class="text-2xl font-bold text-emerald-600">Mango Mart</h1>
                            </div>
                        </div>
                        
                        <!-- Center Section - Search Bar -->
                        <div class="flex-1 flex justify-center px-8">
                            <div class="relative w-full max-w-md">
                                <input type="text" id="search-input" placeholder="Search products..." 
                                    class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"></i>
                            </div>
                        </div>
                        
                        <!-- Right Section -->
                        <div class="flex items-center">
                            <button id="cart-btn" class="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors">
                                <i data-lucide="shopping-cart" class="w-6 h-6"></i>
                                <span id="cart-count" class="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-all duration-200 ${this.cart.length > 0 ? 'animate-pulse' : ''}">${this.cart.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Mobile Menu Overlay -->
            <div id="mobile-menu" class="fixed inset-0 z-50 hidden">
                <div class="fixed inset-0 bg-black bg-opacity-25" id="menu-overlay"></div>
                <div class="absolute top-16 left-1/2 w-full max-w-7xl px-4 sm:px-6 lg:px-8 transform -translate-x-1/2">
                    <div class="bg-white rounded-b-2xl shadow-2xl overflow-hidden transform -translate-y-full transition-transform duration-300 ease-out h-1/2 max-h-[calc(100vh-64px)] flex flex-col" id="menu-panel">
                    <div class="flex items-center justify-between p-4 border-b">
                        <h2 class="text-xl font-semibold text-gray-900">Menu</h2>
                        <button id="close-menu-btn" class="p-2 text-gray-600 hover:text-emerald-600">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>
                        <nav class="p-4 flex-1 overflow-y-auto">
                        <ul class="space-y-2">
                            <li>
                                <button id="orders-btn" class="flex items-center w-full p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                    <i data-lucide="package" class="w-5 h-5 mr-3"></i>
                                    Your Orders
                                </button>
                            </li>
                            <li>
                                <a href="#" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                    <i data-lucide="info" class="w-5 h-5 mr-3"></i>
                                    About Us
                                </a>
                            </li>
                            <li>
                                <a href="#" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                    <i data-lucide="phone" class="w-5 h-5 mr-3"></i>
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a href="#" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                    <i data-lucide="shield-check" class="w-5 h-5 mr-3"></i>
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="#" class="flex items-center p-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors">
                                    <i data-lucide="truck" class="w-5 h-5 mr-3"></i>
                                    Shipping Policy
                                </a>
                            </li>
                            <li class="border-t pt-2 mt-4">
                                <button id="logout-btn" class="flex items-center w-full p-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors">
                                    <i data-lucide="log-out" class="w-5 h-5 mr-3"></i>
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </nav>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <main class="customer-orders__content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <section class="orders-hero">
                    <div class="orders-hero__bg">
                        <span></span>
                    </div>
                    <div class="orders-hero__content">
                        <div>
                            <p class="orders-hero__eyebrow">Order Centre</p>
                            <h1>Your Orders</h1>
                            <p>Track package progress, payment status, and delivery updates in one place.</p>
                        </div>
                        <button id="back-to-home" class="orders-hero__cta">
                            <i data-lucide="arrow-left"></i>
                            Back to Home
                        </button>
                    </div>
                </section>

                <section class="orders-metrics">
                    <div class="orders-metric-card">
                        <div class="orders-metric-card__icon orders-metric-card__icon--total">
                            <i data-lucide="clipboard-list"></i>
                </div>
                        <div>
                            <p>Total Orders</p>
                            <span>${orderStats.total}</span>
                        </div>
                    </div>
                    <div class="orders-metric-card">
                        <div class="orders-metric-card__icon orders-metric-card__icon--active">
                            <i data-lucide="package-search"></i>
                        </div>
                        <div>
                            <p>Active</p>
                            <span>${orderStats.active}</span>
                        </div>
                    </div>
                    <div class="orders-metric-card">
                        <div class="orders-metric-card__icon orders-metric-card__icon--delivered">
                            <i data-lucide="check-circle-2"></i>
                        </div>
                        <div>
                            <p>Delivered</p>
                            <span>${orderStats.delivered}</span>
                        </div>
                    </div>
                    <div class="orders-metric-card">
                        <div class="orders-metric-card__icon orders-metric-card__icon--cod">
                            <i data-lucide="wallet"></i>
                        </div>
                        <div>
                            <p>Cash on Delivery</p>
                            <span>${orderStats.cod}</span>
                        </div>
                    </div>
                </section>

                <section class="orders-section">
                    <div class="orders-section__header">
                        <div>
                            <h2>Order Timeline</h2>
                            <p>Each order card shows status, payment, and items at a glance.</p>
                        </div>
                ${userOrders.length > 0 ? `
                            <div class="orders-legend">
                                <span><i data-lucide="clock"></i> Processing</span>
                                <span><i data-lucide="truck"></i> On the way</span>
                                <span><i data-lucide="check-circle"></i> Delivered</span>
                            </div>
                        ` : ''}
                    </div>

                    ${userOrders.length > 0 ? `
                        <div class="orders-groups">
                            ${activeOrders.length > 0 ? `
                                <div class="orders-group">
                                    <div class="orders-group__header">
                                        <div>
                                            <h3>Active Orders</h3>
                                            <p>Orders currently being prepared or on the way to you.</p>
                                        </div>
                                        <span class="orders-group__badge">${activeOrders.length}</span>
                                    </div>
                                    <div class="orders-group__grid">
                                        ${activeOrders.map((order, index) => this.renderOrderCard(order, index, 'active')).join('')}
                                    </div>
                    </div>
                ` : `
                                <div class="orders-group orders-group--empty">
                                    <div class="orders-group__empty">
                                        <i data-lucide="party-popper"></i>
                                        <h4>All caught up</h4>
                                        <p>You don't have any active orders right now.</p>
                                    </div>
                                </div>
                            `}

                            ${completedOrders.length > 0 ? `
                                <div class="orders-group">
                                    <div class="orders-group__header">
                                        <div>
                                            <h3>Completed Orders</h3>
                                            <p>Your delivered or cancelled orders.</p>
                                        </div>
                                        <span class="orders-group__badge orders-group__badge--muted">${completedOrders.length}</span>
                                    </div>
                                    <div class="orders-group__grid orders-group__grid--compact">
                                        ${completedOrders.map((order, index) => this.renderOrderCard(order, index, 'completed')).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="orders-empty">
                            <div class="orders-empty__icon">
                                <i data-lucide="package"></i>
                            </div>
                            <h3>No orders yet</h3>
                            <p>When you place orders, they will appear here with live tracking updates.</p>
                            <button id="start-shopping" class="orders-empty__cta">
                            Start Shopping
                        </button>
                    </div>
                `}
                </section>
            </main>
            </div>
        `;

        initIcons();
        this.attachEventListeners();
    }

    renderOrderCard(order, index = 0, group = 'active') {
        const statusLabels = {
            pending: { label: 'Pending', className: 'order-status order-status--pending', icon: 'clock' },
            confirmed: { label: 'Confirmed', className: 'order-status order-status--confirmed', icon: 'badge-check' },
            preparing: { label: 'Preparing', className: 'order-status order-status--preparing', icon: 'chef-hat' },
            ready: { label: 'Ready', className: 'order-status order-status--ready', icon: 'sparkles' },
            out_for_delivery: { label: 'Out for Delivery', className: 'order-status order-status--out-for-delivery', icon: 'truck' },
            delivered: { label: 'Delivered', className: 'order-status order-status--delivered', icon: 'check-circle' },
            cancelled: { label: 'Cancelled', className: 'order-status order-status--cancelled', icon: 'x-octagon' }
        };

        const paymentStatus = (order.payment_status || order.paymentStatus || '').toString().toLowerCase();
        const legacyMethod = (order.paymentMethod || order.payment_method || '').toString().toLowerCase();
        const isPaid = paymentStatus === 'paid' || legacyMethod === 'online';
        const paymentLabel = isPaid ? 'Paid Online' : 'Cash on Delivery';
        const paymentIcon = isPaid ? 'credit-card' : 'wallet';

        const createdAt = order.createdAt || order.created_at;
        const estimatedDelivery = order.estimated_delivery || order.expectedDelivery || null;
        const statusKey = (order.status || '').toLowerCase();
        const statusData = statusLabels[statusKey] || { label: order.status || 'Status', className: 'order-status', icon: 'info' };

        const timelineStages = [
            { key: 'pending', label: 'Order Placed', icon: 'shopping-bag' },
            { key: 'confirmed', label: 'Confirmed', icon: 'badge-check' },
            { key: 'preparing', label: 'Preparing', icon: 'chef-hat' },
            { key: 'out_for_delivery', label: 'On the way', icon: 'truck' },
            { key: 'delivered', label: 'Delivered', icon: 'check-circle' }
        ];

        return `
            <article class="customer-order-card customer-order-card--animated customer-order-card--${group}" style="--order-index: ${index + 1}">
                <header class="customer-order-card__header">
                    <p class="customer-order-card__id">Order ID <span>#${order.id}</span></p>
                    <p class="${statusData.className} order-status--inline">
                        <i data-lucide="${statusData.icon}"></i>
                        ${statusData.label}
                    </p>
                </header>

                <div class="customer-order-card__meta">
                    <div>
                        <span>Placed</span>
                        <strong>${createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</strong>
                    </div>
                    <div>
                        <span>Total</span>
                        <strong>${formatCurrency(order.total)}</strong>
                    </div>
                    <div>
                        <span>Payment</span>
                        <strong class="customer-order-payment">
                            <i data-lucide="${paymentIcon}"></i>
                            ${paymentLabel}
                        </strong>
                    </div>
                    <div>
                        <span>Arriving</span>
                        <strong>${estimatedDelivery ? new Date(estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBD'}</strong>
                    </div>
                </div>
                
                <div class="customer-order-card__timeline">
                    ${timelineStages.map((stage, index) => {
                        const stageStatus = timelineStages.findIndex(s => s.key === statusKey);
                        const achieved = stageStatus >= 0 && index <= stageStatus;
                        const inProgress = index === stageStatus && stageStatus !== timelineStages.length - 1;
                        return `
                            <div class="order-timeline-step ${achieved ? 'order-timeline-step--done' : ''} ${inProgress ? 'order-timeline-step--active' : ''}">
                                <div class="order-timeline-step__icon">
                                    <i data-lucide="${stage.icon}"></i>
                                </div>
                                <span>${stage.label}</span>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="customer-order-card__items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <div class="order-item__thumb">
                                <img src="${item.image || 'https://images.unsplash.com/photo-1605027990121-75fd594d6565?w=300'}" alt="${item.name}">
                            </div>
                            <div class="order-item__details">
                                <p class="order-item__name">${item.name}</p>
                                <p class="order-item__meta">Qty: ${item.quantity} × ${formatCurrency(item.price)}</p>
                            </div>
                            <div class="order-item__amount">
                                ${formatCurrency(item.price * item.quantity)}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <footer class="customer-order-card__footer">
                    <div class="customer-order-card__support">
                        <button class="orders-btn orders-btn--ghost">
                            <i data-lucide="message-circle"></i>
                            Support
                        </button>
                        <button class="orders-btn orders-btn--ghost">
                            <i data-lucide="help-circle"></i>
                            Need help?
                        </button>
                        </div>
                    <div class="customer-order-card__actions">
                        ${statusKey === 'delivered' ? `
                            <button class="orders-btn orders-btn--outline">
                                <i data-lucide="refresh-cw"></i>
                                    Reorder
                                </button>
                            ` : ''}
                        ${(statusKey === 'pending' || statusKey === 'confirmed') ? `
                            <button class="orders-btn orders-btn--danger">
                                <i data-lucide="x-circle"></i>
                                    Cancel Order
                                </button>
                            ` : ''}
                        <button class="orders-btn orders-btn--primary">
                            <i data-lucide="receipt"></i>
                            View Invoice
                        </button>
                        </div>
                </footer>
            </div>
        `;
    }
    renderCategoryPage() {
        const app = document.getElementById('app');
        const mainCategory = mainCategories.find(cat => cat.id === this.currentMainCategory);
        const filteredProducts = this.getFilteredProducts();
        const productRows = [];

        for (let i = 0; i < filteredProducts.length; i += 4) {
            productRows.push(filteredProducts.slice(i, i + 4));
        }
        
        if (!mainCategory) {
            this.setView('home');
            this.render();
            return;
        }

        app.innerHTML = `
            <div class="min-h-screen bg-gray-50">
                <!-- Header -->
                <header class="bg-white shadow-sm border-b sticky top-0 z-40">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex items-center justify-between h-16">
                            <!-- Left Section -->
                            <div class="flex items-center">
                                <button id="back-to-home" class="flex items-center text-gray-600 hover:text-emerald-600 mr-4">
                                    <i data-lucide="arrow-left" class="w-5 h-5 mr-2"></i>
                                    Back to Home
                                </button>
                                <h1 class="text-2xl font-bold text-emerald-600">${mainCategory.name}</h1>
                            </div>
                            
                            <!-- Right Section -->
                            <div class="flex items-center space-x-4">
                                <button id="cart-btn" class="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors">
                                    <i data-lucide="shopping-cart" class="w-6 h-6"></i>
                                    <span id="cart-count" class="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-all duration-200 ${this.cart.length > 0 ? 'animate-pulse' : ''}">${this.cart.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Search Bar Section -->
                <div class="search-bar-container sticky top-16 z-30">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div class="search-input-wrapper">
                            <input type="text" id="search-input" placeholder="Search for products in ${mainCategory.name}..." 
                                class="text-base">
                            <i data-lucide="search" class="search-icon"></i>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <!-- Category Header -->
                    <div class="mb-8">
                        <div class="bg-gradient-to-r ${mainCategory.color} rounded-2xl p-8 text-white">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h2 class="text-3xl font-bold mb-2">${mainCategory.name}</h2>
                                    <p class="text-white text-opacity-90 mb-4">${mainCategory.description}</p>
                                    <div class="flex flex-wrap gap-2">
                                        ${mainCategory.subcategories.slice().reverse().map(sub => {
                                            return `
                                                <span class="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                                                    ${sub.charAt(0).toUpperCase() + sub.slice(1)}
                                                </span>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                                <i data-lucide="${mainCategory.icon}" class="w-16 h-16 text-white text-opacity-50"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Subcategories Filter -->
                    <div class="mb-8">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Filter by Subcategory</h3>
                        <div class="flex flex-wrap gap-2">
                            <button class="category-btn px-4 py-2 rounded-full border ${!this.selectedCategory ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}" data-category="">
                                All Products
                            </button>
                            ${mainCategory.subcategories.slice().reverse().map(sub => {
                                return `
                                    <button class="category-btn px-4 py-2 rounded-full border ${this.selectedCategory === sub ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}" data-category="${sub}">
                                        ${sub.charAt(0).toUpperCase() + sub.slice(1)}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Products Grid -->
                    <div class="category-products-wrapper">
                        ${productRows.map(row => `
                            <div class="category-products-row">
                                <div class="category-products-row-inner">
                                    ${row.map(product => {
                                        const cartItem = this.cart.find(item => item.id === product.id);
                                        const quantity = cartItem ? cartItem.quantity : 0;
                                        
                                        return `
                                            <div class="product-card h-full flex flex-col cursor-pointer" data-product-id="${product.id}" data-product-clickable="true">
                                                <div class="product-image-container"><img src="${product.image}" alt="${product.name}"></div>
                                                <div class="p-4 flex flex-col h-full">
                                                    <h3 class="font-semibold text-gray-900 mb-2">${product.name}</h3>
                                                    <p class="text-gray-600 text-sm mb-3" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${product.description || ''}</p>
                                                    <div class="mt-auto space-y-3">
                                                        <div class="product-price-display">
                                                            <span class="product-price-amount">${formatCurrency(product.price)}</span>
                                                            <span class="product-price-stock">${product.stock_quantity !== undefined ? `Stock: ${product.stock_quantity}` : ''}</span>
                                                        </div>
                                                         <div class="product-action" data-product-action="${product.id}">
                                                             <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${product.id}">
                                                                 Add to Cart
                                                             </button>
                                                             <template data-template="add">
                                                                 <button class="add-to-cart-btn w-full btn btn-primary" data-product-id="${product.id}">
                                                                     Add to Cart
                                                                 </button>
                                                             </template>
                                                             <template data-template="quantity">
                                                                 <div class="flex items-center justify-between gap-3">
                                                                     <button class="quantity-btn w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                                     data-product-id="${product.id}" data-action="decrease">
                                                                         <i data-lucide="minus" class="w-5 h-5 sm:w-4 sm:h-4"></i>
                                                             </button>
                                                                     <span class="quantity-display font-semibold text-gray-900 min-w-[2.5rem] text-center text-lg sm:text-base" data-product-quantity="${product.id}">${quantity}</span>
                                                                     <button class="quantity-btn w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                                     data-product-id="${product.id}" data-action="increase">
                                                                         <i data-lucide="plus" class="w-5 h-5 sm:w-4 sm:h-4"></i>
                                                             </button>
                                                         </div>
                                                             </template>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    ${filteredProducts.length === 0 ? `
                        <div class="text-center py-12">
                            <i data-lucide="search" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                            <p class="text-gray-500">No products found in this category</p>
                        </div>
                    ` : ''}
                </main>
            </div>
        `;

        initIcons();
        this.attachEventListeners();
    }
    attachEventListeners() {
        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const inputValue = e.target.value;
                const cursorPos = e.target.selectionStart;
                this.searchQuery = inputValue;
                console.log('Search input:', this.searchQuery); // Debug logging
                
                // Update search results immediately without full render to maintain focus
                this.updateSearchResults();
                
                // Debounce full render - wait 800ms after user stops typing
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    console.log('Executing search for:', this.searchQuery); // Debug logging
                    const hasQuery = !!this.searchQuery.trim();
                    if (hasQuery) {
                        saveRecentSearch(this.searchQuery.trim());
                    }
                    // Stay on home view - search results will show inline
                    if (this.currentView === 'category') {
                        this.currentView = 'home';
                    }
                    
                    // Only do full render if not currently typing (check if input still has focus)
                    const currentInput = document.getElementById('search-input');
                    if (currentInput && document.activeElement !== currentInput) {
                        // Input lost focus, safe to do full render
                        this.render();
                    } else {
                        // Input still has focus, just update results area
                        this.updateSearchResults();
                    }
                }, 800);
            });

            // Search on Enter key (immediate search)
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && this.searchQuery.trim()) {
                    console.log('Enter key pressed for search:', this.searchQuery); // Debug logging
                    clearTimeout(this.searchTimeout); // Cancel debounced search
                    saveRecentSearch(this.searchQuery.trim());
                    // Stay on home view - search results will show inline
                    if (this.currentView === 'category') {
                        this.currentView = 'home';
                    }
                    
                    // Save cursor position before render
                    const cursorPos = e.target.selectionStart;
                    const inputValue = e.target.value;
                    
                    this.render();
                    
                    // Restore focus and cursor position after render
                    setTimeout(() => {
                        const newSearchInput = document.getElementById('search-input');
                        if (newSearchInput) {
                            newSearchInput.focus();
                            newSearchInput.value = inputValue;
                            newSearchInput.setSelectionRange(cursorPos, cursorPos);
                        }
                    }, 0);
                }
            });

            // Attach trending suggestions
            attachTrendingToInput(searchInput, (term) => {
                this.searchQuery = term;
                saveRecentSearch(term);
                // Stay on home view - search results will show inline
                if (this.currentView === 'category') {
                    this.currentView = 'home';
                }
                
                this.render();
                
                // Restore focus after render
                setTimeout(() => {
                    const newSearchInput = document.getElementById('search-input');
                    if (newSearchInput) {
                        newSearchInput.focus();
                        newSearchInput.value = term;
                        newSearchInput.setSelectionRange(term.length, term.length);
                    }
                }, 0);
            });
        }

        // Main Category Cards
        document.querySelectorAll('.main-category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.category;
                this.currentMainCategory = categoryId;
                this.setView('category');
                this.selectedCategory = null; // Reset subcategory filter
                this.render();
                this.pushHistoryState();
            });
        });

        // Back to Home button
        const backBtn = document.getElementById('back-to-home');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                const fallback = () => {
                    this.setView('home');
                    this.currentMainCategory = null;
                    this.selectedCategory = null;
                    this.searchQuery = '';
                    this.render();
                    this.pushHistoryState({ replace: true });
                };
                this.safeGoBack(fallback);
            });
        }

        // Clear Search button
        const clearSearchBtn = document.getElementById('clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.searchQuery = '';
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = '';
                }
                this.setView('home');
                this.render();
                this.pushHistoryState({ replace: true });
            });
        }

        // Orders button is now a direct link to orders.html

        // Start shopping button
        const startShoppingBtn = document.getElementById('start-shopping');
        if (startShoppingBtn) {
            startShoppingBtn.addEventListener('click', () => {
                this.setView('home');
                this.render();
                this.pushHistoryState({ replace: true });
            });
        }

        // Subcategory Filters
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectedCategory = e.target.dataset.category || null;
                this.render();
                this.pushHistoryState();
            });
        });

        // Add to cart and quantity buttons - use event delegation
        const app = document.getElementById('app');
        if (app) {
            // Remove old listeners if they exist
            if (this._addToCartHandler) {
                app.removeEventListener('click', this._addToCartHandler);
            }
            if (this._quantityBtnHandler) {
                app.removeEventListener('click', this._quantityBtnHandler);
            }
            
            // Add-to-cart button handler (event delegation)
            this._addToCartHandler = (e) => {
                const btn = e.target.closest('.add-to-cart-btn');
                if (btn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const productId = btn.dataset.productId;
                const product = this.products.find(p => p.id === productId);
                    if (product) this.addToCart(product);
                }
            };
            app.addEventListener('click', this._addToCartHandler);
            
            // Quantity button handler (event delegation)
            this._quantityBtnHandler = (e) => {
                const btn = e.target.closest('.quantity-btn');
                if (btn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const productId = btn.dataset.productId;
                    const action = btn.dataset.action;
                    const product = this.products.find(p => p.id === productId);
                if (product) {
                        const cartItem = this.cart.find(item => item.id === productId);
                        const currentQuantity = cartItem ? cartItem.quantity : 0;
                    if (action === 'increase') {
                        this.addToCart(product);
                    } else if (action === 'decrease') {
                            this.updateCartQuantity(productId, currentQuantity - 1);
                        }
                    }
                }
            };
            app.addEventListener('click', this._quantityBtnHandler);
        }

        // Product card click listeners (for viewing product details)
        document.querySelectorAll('[data-product-clickable="true"]').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on buttons or interactive elements
                if (e.target.closest('button') || e.target.closest('.add-to-cart-btn') || e.target.closest('.quantity-btn')) {
                    return;
                }
                const productId = card.dataset.productId;
                if (productId) {
                    this.showProductDetail(productId);
                }
            });
        });

        // Cart button
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', async () => {
                await this.showCart();
            });
        }

        // Hamburger Menu
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuOverlay = document.getElementById('menu-overlay');
        const menuPanel = document.getElementById('menu-panel');
        const closeMenuBtn = document.getElementById('close-menu-btn');

        if (hamburgerBtn && mobileMenu && menuPanel) {
            const openMenu = () => {
                mobileMenu.classList.remove('hidden');
                requestAnimationFrame(() => {
                    menuPanel.classList.remove('-translate-y-full');
                    menuPanel.classList.add('translate-y-0');
                });
            };

            const closeMenu = () => {
                menuPanel.classList.remove('translate-y-0');
                menuPanel.classList.add('-translate-y-full');
                setTimeout(() => {
                    mobileMenu.classList.add('hidden');
                }, 300);
            };

            hamburgerBtn.addEventListener('click', openMenu);

            if (closeMenuBtn) {
                closeMenuBtn.addEventListener('click', closeMenu);
        }

        if (menuOverlay) {
                menuOverlay.addEventListener('click', closeMenu);
            }
        }

        // Back to shop button (for cart page)
        const backToShopBtn = document.getElementById('back-to-shop');
        if (backToShopBtn) {
            backToShopBtn.addEventListener('click', () => {
                const fallback = () => {
                    this.setView('home');
                    this.render();
                    this.pushHistoryState({ replace: true });
                };
                this.safeGoBack(fallback);
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.authManager.signOut();
            });
        }
    }

    async showCart(options = {}) {
        const { skipHistory = false } = options;
        // NEVER reload from Supabase - use the local cart that was just updated!
        // This prevents the quantity mismatch bug
        
        if (this.currentView !== 'cart') {
            this.previousView = this.currentView;
        }
        this.currentView = 'cart';
        this.currentProductId = null;

        if (!this._historyInitialized) {
            this.initializeHistory();
        }

        if (!skipHistory) {
            this.pushHistoryState();
        }

        const totals = this.calculateCartTotals();

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen bg-gray-50">
                <header class="bg-white shadow-sm border-b">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between items-center h-16">
                            <button id="back-to-shop" class="flex items-center text-gray-600 hover:text-emerald-600">
                                <i data-lucide="arrow-left" class="w-5 h-5 mr-2"></i>
                                Back to Shop
                            </button>
                            <h1 class="text-xl font-semibold">Shopping Cart</h1>
                            <div></div>
                        </div>
                    </div>
                </header>

                <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    ${this.cart.length === 0 ? `
                        <div class="text-center py-12">
                            <i data-lucide="shopping-cart" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                            <h2 class="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                            <p class="text-gray-600 mb-6">Add some products to get started!</p>
                            <button id="continue-shopping" class="btn btn-primary">Continue Shopping</button>
                        </div>
                    ` : `
                        <div class="space-y-3 sm:space-y-4">
                            ${this.cart.map(item => `
                                <div class="cart-item bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
                                    <div class="cart-item__body flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div class="cart-item__overview flex items-start sm:items-center gap-3 sm:gap-4 w-full">
                                            <img src="${item.image}" alt="${item.name}" class="cart-item__image w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-100">
                                            <div class="cart-item__details flex-1">
                                                <div class="flex items-start justify-between gap-2">
                                                    <h3 class="cart-item__title font-semibold text-gray-900 text-base sm:text-lg">${item.name || 'Unknown Product'}</h3>
                                                    <span class="cart-item__item-price text-sm sm:text-base font-semibold text-emerald-600">
                                                        ${formatCurrency(item.price || 0)}
                                                    </span>
                                        </div>
                                                <p class="cart-item__meta text-sm text-gray-500 mt-1">
                                                    ${item.brand ? `${item.brand} • ` : ''}${item.weight || item.size || 'Standard pack'}
                                                </p>
                                                <div class="cart-item__subtotal mt-3 sm:mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-medium">
                                                    <i data-lucide="calculator" class="w-4 h-4"></i>
                                                    Subtotal: ${formatCurrency((item.price || 0) * (item.quantity || 1))}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="cart-item__actions flex flex-col sm:flex-row sm:items-center sm:justify-end w-full sm:w-auto gap-3">
                                            <div class="cart-item__quantity-controls flex items-center justify-center sm:justify-end sm:ml-auto">
                                                <button class="quantity-btn cart-item__quantity-btn rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                    data-id="${item.id}" data-action="decrease">
                                                    <i data-lucide="minus" class="w-5 h-5 sm:w-5 sm:h-5 md:w-4 md:h-4"></i>
                                            </button>
                                                <span class="cart-item__quantity-value quantity font-semibold text-gray-900 text-lg sm:text-xl md:text-base">
                                                    ${item.quantity}
                                                </span>
                                                <button class="quantity-btn cart-item__quantity-btn rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all active:scale-95" 
                                                    data-id="${item.id}" data-action="increase">
                                                    <i data-lucide="plus" class="w-5 h-5 sm:w-5 sm:h-5 md:w-4 md:h-4"></i>
                                                </button>
                                            </div>
                                            <button class="remove-btn cart-item__remove mt-1 sm:mt-0 text-sm text-gray-500 hover:text-red-500 transition-colors"
                                                    data-id="${item.id}" data-action="remove">
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Checkout Form -->
                        <div class="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-6">Checkout Details</h3>
                            
                            <form id="checkout-form" class="space-y-3 sm:space-y-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                                        <input type="text" id="customer-name" required 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="Enter your full name">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                                        <input type="tel" id="customer-mobile" required 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="Enter your mobile number">
                                    </div>
                                </div>
                                
                                <div class="space-y-3">
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                                    <textarea id="customer-address" required rows="3"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Enter your complete address"></textarea>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Landmark</label>
                                        <input type="text" id="customer-landmark" 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="Nearby landmark (optional)">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                                        <input type="text" id="customer-pincode" required 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="Enter pincode">
                                    </div>
                                </div>
                                
                                <div class="border-t pt-4 space-y-4">
                                    <div class="space-y-2 text-sm text-gray-600">
                                        <div class="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>${formatCurrency(totals.subtotal)}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Platform Fee</span>
                                            <span>${formatCurrency(totals.platformFee)}</span>
                                        </div>
                                        <div class="flex justify-between ${totals.deliveryCharge === 0 ? 'text-emerald-600 font-semibold' : ''}">
                                            <span>Delivery Charge</span>
                                            <span>${totals.deliveryCharge === 0 ? 'Free' : formatCurrency(totals.deliveryCharge)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div class="flex justify-between items-center">
                                            <span class="text-lg font-semibold">Payable Amount:</span>
                                            <span class="text-2xl font-bold text-emerald-600">${formatCurrency(totals.total)}</span>
                                        </div>
                                        <p class="mt-1 text-xs ${totals.deliveryCharge === 0 ? 'text-emerald-600 font-medium' : 'text-gray-500'}">
                                            ${totals.deliveryCharge === 0 
                                                ? `Free delivery applied on orders above ₹${totals.deliveryThreshold}.`
                                                : `Delivery charge waived once your cart exceeds ₹${totals.deliveryThreshold}.`}
                                        </p>
                                    </div>
                                    <div class="p-4 bg-gradient-to-br from-emerald-50 to-transparent rounded-lg border-2 border-emerald-200">
                                        <label class="block text-sm font-bold text-gray-800 mb-4 flex items-center">
                                            <i data-lucide="credit-card" class="w-5 h-5 mr-2 text-emerald-600"></i>
                                            Choose Payment Method
                                        </label>
                                        <div class="space-y-3">
                                            <!-- Online Payment Option -->
                                            <label class="flex items-center p-4 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all duration-200 active:bg-emerald-50">
                                                <input type="radio" name="payment-method" value="razorpay" class="payment-method-radio w-4 h-4 cursor-pointer" checked>
                                                <div class="ml-3 flex-1">
                                                    <div class="font-semibold text-gray-800">Online Payment</div>
                                                    <div class="text-xs text-gray-500 mt-1">Credit/Debit Card, UPI, Wallets</div>
                                                </div>
                                                <i data-lucide="shield-check" class="w-5 h-5 text-emerald-600 flex-shrink-0"></i>
                                            </label>
                                            
                                            <!-- Cash on Delivery Option -->
                                            <label class="flex items-center p-4 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all duration-200 active:bg-emerald-50">
                                                <input type="radio" name="payment-method" value="cod" class="payment-method-radio w-4 h-4 cursor-pointer">
                                                <div class="ml-3 flex-1">
                                                    <div class="font-semibold text-gray-800">Cash on Delivery</div>
                                                    <div class="text-xs text-gray-500 mt-1">Pay when you receive your order</div>
                                                </div>
                                                <i data-lucide="banknote" class="w-5 h-5 text-blue-600 flex-shrink-0"></i>
                                            </label>
                                        </div>
                                    </div>
                                    <div class="flex items-start space-x-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <input type="checkbox" id="terms-consent" class="terms-checkbox text-emerald-600 border-gray-300 rounded focus:ring-emerald-500">
                                        <label for="terms-consent" class="text-sm text-gray-700 leading-relaxed">
                                            I agree to Mango Mart's <a href="terms.html" class="text-emerald-600 hover:text-emerald-700 font-medium" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a> and acknowledge the <a href="privacy.html" class="text-emerald-600 hover:text-emerald-700 font-medium" target="_blank" rel="noopener noreferrer">Privacy Policy</a>. I understand my order cannot be processed without this consent.
                                        </label>
                                    </div>
                                    <button type="submit" id="place-order" class="w-full btn btn-primary" disabled>
                                        <i data-lucide="credit-card" class="w-4 h-4 mr-2"></i>
                                        Place Order & Pay
                                    </button>
                                </div>
                            </form>
                        </div>
                    `}
                </main>
            </div>
        `;

                initIcons();
        
        // IMPORTANT: Attach event listeners AFTER icons are initialized
        const self = this;
        setTimeout(() => {
            self.attachCartEventListeners();
        }, 50);
        this.saveViewState();
    }
    attachCartEventListeners() {
        // Back to shop
        const backBtn = document.getElementById('back-to-shop');
        const continueBtn = document.getElementById('continue-shopping');
        const fallbackToHome = () => {
            this.setView('home');
            this.currentMainCategory = null;
            this.currentProductId = null;
            this.render();
            this.pushHistoryState({ replace: true });
        };
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.safeGoBack(fallbackToHome);
            });
        }
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.safeGoBack(fallbackToHome);
            });
        }

        // Quantity controls - Attach with proper context and immediate updates
        const self = this;
        const quantityBtns = document.querySelectorAll('.quantity-btn');
        
                // Amazon-like quantity handler - Simple and reliable
        const handleQuantityChange = async (productId, action) => {
            // Prevent duplicate clicks - if this product is already being processed, ignore
            const processingKey = `cart_${productId}_${action}`;
            if (self.processingCart.has(processingKey)) {
                console.log('Cart quantity update already in progress, ignoring duplicate click');
                return;
            }

            // Mark as processing
            self.processingCart.add(processingKey);

            try {
                // Find item in cart
                const itemIndex = self.cart.findIndex(item => String(item.id) === String(productId));
                if (itemIndex === -1) {
                    console.error('Product not found in cart:', productId);
                    toast.error('Product not found');
                    self.processingCart.delete(processingKey);
                    return;
                }
                
                const item = self.cart[itemIndex];
                const currentQty = item.quantity || 1;
                let newQty = currentQty;
                
                // Calculate new quantity
                if (action === 'increase') {
                    newQty = currentQty + 1;
                } else if (action === 'decrease') {
                    newQty = currentQty - 1;
                } else {
                    console.error('Invalid action:', action);
                    self.processingCart.delete(processingKey);
                    return;
                }
                
                // Validate quantity
                if (newQty < 0) {
                    newQty = 0;
                } else if (newQty > 999) {
                    toast.error('Maximum 999 items allowed');
                    self.processingCart.delete(processingKey);
                    return;
                }
                
                // Update or remove
                if (newQty === 0) {
                    // Remove from cart
                    const itemName = item.name || 'Product';
                    self.cart.splice(itemIndex, 1);
                    
                    // Show toast BEFORE re-rendering
                    toast.success(`✅ ${itemName} removed from cart`);
                    
                    // Then update UI and sync
                    self.showCart({ skipHistory: true });
                    await self.removeFromCart(productId).catch(e => console.error('Remove error:', e));
                } else {
                    // Update quantity
                    self.cart[itemIndex].quantity = newQty;
                    
                    // Show toast with the ACTUAL new quantity we just set
                    toast.success(`✅ ${item.name} - Qty: ${newQty}`);
                    
                    // Then update UI and sync
                    self.showCart({ skipHistory: true });
                    await self.updateCartQuantity(productId, newQty).catch(e => console.error('Update error:', e));
                }
            } catch (err) {
                console.error('Quantity error:', err);
                toast.error('Failed to update quantity');
            } finally {
                // Always remove from processing set when done
                self.processingCart.delete(processingKey);
            }
        };
        
        quantityBtns.forEach((btn, idx) => {
            btn.removeEventListener('click', btn.__quantityHandler);  // Remove old listener if exists
            
            btn.__quantityHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const productId = btn.dataset.id;
                const action = btn.dataset.action;
                
                if (!productId || !action) return;

                // Check if already processing before disabling button
                const processingKey = `cart_${productId}_${action}`;
                if (self.processingCart.has(processingKey)) {
                    console.log('Already processing, ignoring click');
                    return;
                }
                
                // Handle synchronously for instant feedback (Amazon style)
                btn.disabled = true;
                handleQuantityChange(productId, action).finally(() => {
                    btn.disabled = false;
                });
            };
            
            btn.addEventListener('click', btn.__quantityHandler);
        });

        // Remove items
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.remove-btn').dataset.id;
                this.removeFromCart(id);
            });
        });

        // Terms & Conditions consent
        const termsCheckbox = document.getElementById('terms-consent');
        const placeOrderBtn = document.getElementById('place-order');
        const togglePlaceOrderState = () => {
            if (!placeOrderBtn) return;
            const isAllowed = !!termsCheckbox?.checked;
            placeOrderBtn.disabled = !isAllowed;
            if (isAllowed) {
                placeOrderBtn.classList.remove('opacity-60', 'cursor-not-allowed');
            } else {
                placeOrderBtn.classList.add('opacity-60', 'cursor-not-allowed');
            }
        };

        if (termsCheckbox) {
            termsCheckbox.addEventListener('change', togglePlaceOrderState);
            togglePlaceOrderState();
        }

        // GLOBAL BACKUP LISTENER for quantity buttons  
        // This catches quantity button clicks using event delegation
        const mainElement = document.querySelector('main');
        if (mainElement && !mainElement.__quantityListenerAttached) {
            mainElement.__quantityListenerAttached = true;
            
            mainElement.addEventListener('click', (e) => {
                const btn = e.target.closest('.quantity-btn');
                if (!btn || !btn.dataset.id || !btn.dataset.action) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                const productId = btn.dataset.id;
                const action = btn.dataset.action;

                // Check if already processing before disabling button
                const processingKey = `cart_${productId}_${action}`;
                if (self.processingCart.has(processingKey)) {
                    console.log('Already processing (global listener), ignoring click');
                    return;
                }
                
                btn.disabled = true;
                handleQuantityChange(productId, action).finally(() => {
                    btn.disabled = false;
                });
            }, true);
        }

        // Checkout form
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCheckout();
            });
        }
    }

    handleCheckout() {
        // Get form data
        const customerName = document.getElementById('customer-name').value.trim();
        const customerMobile = document.getElementById('customer-mobile').value.trim();
        const customerAddress = document.getElementById('customer-address').value.trim();
        const customerLandmark = document.getElementById('customer-landmark').value.trim();
        const customerPincode = document.getElementById('customer-pincode').value.trim();
        
        // Get selected payment method
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'razorpay';

        // Validate form
        if (!customerName || !customerMobile || !customerAddress || !customerPincode) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Validate mobile number
        if (!/^\d{10}$/.test(customerMobile)) {
            toast.error('Please enter a valid 10-digit mobile number');
            return;
        }

        // Validate pincode
        if (!/^\d{6}$/.test(customerPincode)) {
            toast.error('Please enter a valid 6-digit pincode');
            return;
        }

        const termsConsent = document.getElementById('terms-consent');
        if (termsConsent && !termsConsent.checked) {
            toast.error('Please accept the Terms & Conditions to continue');
            return;
        }

        // Calculate total amount with platform and delivery charges
        const totals = this.calculateCartTotals();
        const totalAmount = totals.total;
        
        if (this.cart.length === 0 || totals.subtotal <= 0) {
            toast.error('Your cart is empty');
            return;
        }

        // Validate minimum amount for Razorpay (₹1 = 100 paise)
        if (totalAmount < 1) {
            toast.error('Minimum order amount is ₹1');
            return;
        }

        // Show loading state
        const placeOrderBtn = document.getElementById('place-order');
        if (placeOrderBtn) {
            placeOrderBtn.disabled = true;
            placeOrderBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i>Processing...';
            initIcons();
        }

        // Generate order ID
        const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        
        // Create order data
        const orderData = {
            id: orderId,
            customerName,
            customerMobile,
            customerAddress,
            customerLandmark,
            customerPincode,
            items: [...this.cart],
            subtotalAmount: totals.subtotal,
            platformFee: totals.platformFee,
            deliveryCharge: totals.deliveryCharge,
            totalAmount,
            status: 'pending',
            paymentStatus: paymentMethod === 'cod' ? 'cash_on_delivery' : 'pending',
            paymentMethod: paymentMethod,
            createdAt: new Date().toISOString()
        };

        // Store order data temporarily
        localStorage.setItem('pendingOrder', JSON.stringify(orderData));

        // Route to appropriate payment method
        setTimeout(() => {
            if (paymentMethod === 'cod') {
                // Cash on Delivery - skip Razorpay and go directly to order completion
                console.log('Processing Cash on Delivery order...');
                this.handleCashOnDelivery(orderData);
            } else if (typeof Razorpay !== 'undefined' && checkRazorpayAvailability()) {
                console.log('Razorpay is available, initiating payment...');
                this.initiateRazorpayPayment(orderData);
            } else {
                console.log('Razorpay not available, using mock payment...');
                // Fallback to mock payment for testing
                this.initiateMockPayment(orderData);
            }
        }, 500);
    }
    initiateRazorpayPayment(orderData) {
        // Check if Razorpay is available
        if (typeof Razorpay === 'undefined') {
            toast.error('Payment gateway is not loaded. Please refresh the page and try again.');
            console.error('Razorpay is not available');
            this.resetPlaceOrderButton();
            return;
        }

        const options = {
            key: RAZORPAY_CONFIG.key,
            amount: Math.round(orderData.totalAmount * 100), // Convert to paise
            currency: RAZORPAY_CONFIG.currency,
            name: RAZORPAY_CONFIG.name,
            description: `Order #${orderData.id} - ${RAZORPAY_CONFIG.description}`,
            image: RAZORPAY_CONFIG.image,
            handler: (response) => {
                this.handlePaymentSuccess(response, orderData);
            },
            prefill: {
                name: orderData.customerName,
                contact: orderData.customerMobile,
                email: 'customer@mangomart.com'
            },
            notes: {
                order_id: orderData.id,
                address: orderData.customerAddress,
                landmark: orderData.customerLandmark,
                pincode: orderData.customerPincode
            },
            modal: {
                ondismiss: () => {
                    console.log('Razorpay modal dismissed by user before payment');
                    this.handleOnlinePaymentFailure(orderData, { error: { description: 'Payment window closed by user' } });
                }
            },
            theme: {
                color: '#10B981'
            }
        };

        try {
            console.log('Razorpay options:', options);
            const razorpay = new Razorpay(options);
            
            razorpay.on('payment.failed', async (response) => {
                console.error('Payment failed:', response?.error);
                await this.handleOnlinePaymentFailure(orderData, response);
            });

            razorpay.open();
        } catch (error) {
            toast.error('Failed to initialize payment. Please try again.');
            console.error('Razorpay initialization error:', error);
            this.resetPlaceOrderButton();
        }
    }
    async handlePaymentSuccess(response, orderData) {
        console.log('=== PAYMENT SUCCESS ===');
        localStorage.removeItem('pendingOrder');
        
        // Get current user
        const session = JSON.parse(localStorage.getItem('session') || 'null');
        if (!session || !session.user) {
            console.error('No user session found');
            toast.error('Please login to place an order');
            return;
        }

        // Derive payment status/method flags
        const initialStatus = (orderData.paymentStatus || orderData.payment_status || '').toString().toLowerCase();
        const methodIndicator = (orderData.paymentMethod || orderData.payment_method || '').toString().toLowerCase();
        const isCashOnDelivery = methodIndicator === 'cod' || initialStatus === 'cash_on_delivery';
        const finalPaymentStatus = isCashOnDelivery ? 'cash_on_delivery' : 'paid';

        const order = {
            id: orderData.id,
            customer_id: session.user.id, // This should be a valid UUID
            customer_name: orderData.customerName || session.user.name,
            customer_email: session.user.email || null, // Allow null for mobile-only users
            customer_mobile: orderData.customerMobile || session.user.mobile || null, // Allow null for email-only users
            customer_address: orderData.customerAddress,
            customer_landmark: orderData.customerLandmark,
            customer_pincode: orderData.customerPincode,
            items: orderData.items,
            product_id: orderData.items && orderData.items.length > 0 ? orderData.items[0].id : null,
            total_amount: orderData.totalAmount,
            status: 'confirmed',
            payment_status: finalPaymentStatus,
            payment_id: response.razorpay_payment_id || orderData.payment_id || null,
            payment_signature: response.razorpay_signature,
            created_at: new Date().toISOString(),
            paid_at: isCashOnDelivery ? null : new Date().toISOString(),
            delivery_status: 'pending'
        };

        // Ensure at least one contact method is provided
        if (!order.customer_email && !order.customer_mobile) {
            console.error('Both email and mobile are null for user:', session.user);
            toast.error('User contact information is missing');
            return;
        }

        console.log('Order customer_id:', order.customer_id);
        console.log('Session user ID:', session.user.id);

        console.log('Saving order:', order);

        // Save to Supabase
        try {
            console.log('Supabase status:', { supabase: !!supabase, supabaseReady });
            
            if (supabase && supabaseReady) {
                console.log('Attempting to save order to Supabase...');
                console.log('Order data being sent:', JSON.stringify(order, null, 2));
                
                const { data, error } = await supabase
                    .from('orders')
                    .insert([order])
                    .select();
                
                if (error) {
                    console.error('❌ Supabase error:', error);
                    console.error('Error details:', JSON.stringify(error, null, 2));
                    
                    // Check if it's a column error
                    if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
                        console.error('Column error detected - product_id column might be missing');
                        alert('Database error: Missing column. Please run the SQL setup script.');
                    }
                    
                    throw error;
                }
                
                console.log('✅ Order saved to Supabase successfully:', data);
                toast.success('Order placed successfully!');
                
                // Verify the order was saved
                setTimeout(async () => {
                    try {
                        const { data: verifyData, error: verifyError } = await supabase
                            .from('orders')
                            .select('*')
                            .eq('id', order.id);
                        
                        if (verifyError) {
                            console.error('Verification error:', verifyError);
                        } else {
                            console.log('Order verification successful:', verifyData);
                        }
                    } catch (verifyErr) {
                        console.error('Order verification failed:', verifyErr);
                    }
                }, 1000);
                
            } else {
                console.log('Supabase not available, using localStorage');
                throw new Error('Supabase not available');
            }
        } catch (error) {
            console.error('Failed to save to Supabase:', error);
            console.log('Falling back to localStorage...');
            
            // Save to localStorage as backup
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.push(order);
            localStorage.setItem('orders', JSON.stringify(orders));
            console.log('Order saved to localStorage as fallback');
            toast.success('Order placed successfully!');
        }

        // Store order details for thanks page
        localStorage.setItem('lastOrderId', order.id);
        localStorage.setItem('lastOrderTotal', formatCurrency(order.total_amount));
        localStorage.setItem('lastOrderDate', new Date(order.created_at).toLocaleDateString());

        // Clear cart from Supabase and local storage
        try {
            const currentUser = this.authManager.getUser();
            if (currentUser) {
                const userId = currentUser.id || currentUser.user_metadata?.id;
                if (userId) {
                    console.log('Clearing user cart from Supabase for userId:', userId);
                    await this.authManager.clearUserCart(userId);
                    console.log('Cart cleared from Supabase');
                }
            }
        } catch (error) {
            console.error('Error clearing cart from Supabase:', error);
        }
        
        // Clear local cart
        this.cart = [];
        // Cart is now stored in Supabase only - no localStorage
        console.log('Local cart cleared');

        // Show success message
        toast.success('Redirecting...');

        // Redirect to thanks page
        console.log('=== PAYMENT SUCCESS - REDIRECTING ===');
        console.log('Order ID:', order.id);
        console.log('Total Amount:', order.total_amount);
        console.log('Formatted Total:', formatCurrency(order.total_amount));
        console.log('Order Date:', new Date(order.created_at).toLocaleDateString());
        
        const redirectUrl = `thanks.html?orderId=${order.id}&total=${formatCurrency(order.total_amount)}&date=${new Date(order.created_at).toLocaleDateString()}`;
        console.log('Redirect URL:', redirectUrl);
        
        setTimeout(() => {
            console.log('Executing redirect to:', redirectUrl);
            window.location.href = redirectUrl;
        }, 1500);
    }

    resetPlaceOrderButton() {
        const placeOrderBtn = document.getElementById('place-order');
        const termsCheckbox = document.getElementById('terms-consent');
        if (!placeOrderBtn) return;

        const isAllowed = !!termsCheckbox?.checked;
        placeOrderBtn.disabled = !isAllowed;
        placeOrderBtn.innerHTML = '<i data-lucide="credit-card" class="w-4 h-4 mr-2"></i>Place Order & Pay';

        if (isAllowed) {
            placeOrderBtn.classList.remove('opacity-60', 'cursor-not-allowed');
        } else {
            placeOrderBtn.classList.add('opacity-60', 'cursor-not-allowed');
        }

        initIcons();
    }

    initiateMockPayment(orderData) {
        // Mock payment for testing when Razorpay is not available
        console.log('Initiating mock payment for order:', orderData.id);
        toast.success('Using mock payment for testing. Razorpay is not available.');
        
        // Ensure order has user information
        const session = JSON.parse(localStorage.getItem('session') || 'null');
        if (session && session.user) {
            orderData.customerId = orderData.customerId || session.user.id;
            orderData.customerName = orderData.customerName || session.user.name;
            orderData.customerEmail = orderData.customerEmail || session.user.email;
            orderData.customerMobile = orderData.customerMobile || session.user.mobile;
        }
        
        // Simulate payment success after 2 seconds
        setTimeout(() => {
            const mockResponse = {
                razorpay_payment_id: 'mock_payment_' + Date.now(),
                razorpay_signature: 'mock_signature_' + Math.random().toString(36).substr(2, 9)
            };
            
            console.log('Mock payment successful:', mockResponse);
            this.handlePaymentSuccess(mockResponse, orderData);
        }, 2000);
    }

    async handleCashOnDelivery(orderData) {
        console.log('Processing Cash on Delivery order:', orderData.id);
        toast.success('Redirecting...');
        
        // Create mock payment response for COD
        const codResponse = {
            razorpay_payment_id: 'cod_' + Date.now(),
            razorpay_signature: 'cod_signature_' + Math.random().toString(36).substr(2, 9)
        };
        
        // Set payment status as pending (to be paid on delivery)
        orderData.paymentStatus = 'cash_on_delivery';
        orderData.payment_id = codResponse.razorpay_payment_id;
        
        // Process the order
        setTimeout(() => {
            console.log('Cash on Delivery order confirmed:', orderData.id);
            this.handlePaymentSuccess(codResponse, orderData);
        }, 1500);
    }
}
// ===== DELIVERY DASHBOARD =====
class DeliveryDashboard {
    constructor(authManager) {
        this.authManager = authManager;
        this.orders = [];
        this.previousOrders = [];
        this.currentOrder = null;
    }

    async init() {
        await this.loadOrders();
        this.render();
    }

    async loadOrders() {
        try {
            console.log('Loading delivery orders...');
            if (supabase && supabaseReady) {
                // Use orders table directly to avoid enhanced view data mismatches
                const { data: allOrders, error } = await supabase
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Error loading orders from table:', error);
                    return;
                }
                
                // Separate active and previous orders
                this.orders = allOrders.filter(order => 
                    ['pending', 'picked_up', 'out_for_delivery'].includes(order.delivery_status)
                ) || [];
                
                this.previousOrders = allOrders.filter(order => 
                    order.delivery_status === 'delivered'
                ) || [];
                
                console.log('Loaded active orders:', this.orders.length);
                console.log('Loaded previous orders:', this.previousOrders.length);
            } else {
                console.log('Supabase not ready');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    render() {
        console.log('DeliveryDashboard render called');
        const app = document.getElementById('app');
        if (!app) {
            console.error('App element not found');
            return;
        }

        const agent = this.authManager.getUser();
        console.log('Current delivery agent:', agent);
        const stats = this.getStats();
        console.log('Delivery stats:', stats);

        app.innerHTML = `
            <div class="delivery-dashboard min-h-screen bg-gray-50">
                <!-- Header -->
                <header class="bg-white shadow-sm border-b">
                    <div class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 py-3 sm:py-0 sm:h-16">
                            <div class="flex items-center">
                                <h1 class="text-xl sm:text-2xl font-bold text-emerald-600">Delivery Dashboard</h1>
                            </div>
                            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                                <span class="text-sm sm:text-base text-gray-700">Welcome, ${agent.name} (${agent.agent_id})</span>
                                <button id="logout-btn" class="btn btn-outline text-sm sm:text-base w-full sm:w-auto">Sign Out</button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
                    <!-- Stats Cards -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                        <div class="bg-white p-3 sm:p-6 rounded-lg shadow">
                            <div class="flex items-center">
                                <div class="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
                                    <i data-lucide="clock" class="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600"></i>
                                </div>
                                <div class="ml-2 sm:ml-4">
                                    <p class="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                                    <p class="text-lg sm:text-2xl font-bold text-gray-900">${stats.pending}</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white p-3 sm:p-6 rounded-lg shadow">
                            <div class="flex items-center">
                                <div class="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                                    <i data-lucide="package" class="w-4 h-4 sm:w-6 sm:h-6 text-blue-600"></i>
                                </div>
                                <div class="ml-2 sm:ml-4">
                                    <p class="text-xs sm:text-sm font-medium text-gray-600">Picked Up</p>
                                    <p class="text-lg sm:text-2xl font-bold text-gray-900">${stats.picked_up}</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white p-3 sm:p-6 rounded-lg shadow">
                            <div class="flex items-center">
                                <div class="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                                    <i data-lucide="truck" class="w-4 h-4 sm:w-6 sm:h-6 text-purple-600"></i>
                                </div>
                                <div class="ml-2 sm:ml-4">
                                    <p class="text-xs sm:text-sm font-medium text-gray-600">Out for Delivery</p>
                                    <p class="text-lg sm:text-2xl font-bold text-gray-900">${stats.out_for_delivery}</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white p-3 sm:p-6 rounded-lg shadow">
                            <div class="flex items-center">
                                <div class="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                                    <i data-lucide="check-circle" class="w-4 h-4 sm:w-6 sm:h-6 text-green-600"></i>
                                </div>
                                <div class="ml-2 sm:ml-4">
                                    <p class="text-xs sm:text-sm font-medium text-gray-600">Delivered</p>
                                    <p class="text-lg sm:text-2xl font-bold text-gray-900">${stats.delivered}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Orders List -->
                    <div class="bg-white rounded-lg shadow">
                        <div class="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <h2 class="text-base sm:text-lg font-semibold text-gray-900">Orders</h2>
                                <button id="refresh-btn" class="btn btn-primary text-sm sm:text-base w-full sm:w-auto">
                                    <i data-lucide="refresh-cw" class="w-4 h-4 mr-2"></i>
                                    Refresh
                                </button>
                            </div>
                        </div>
                        <div id="orders-container" class="p-3 sm:p-6">
                            ${this.renderOrders()}
                        </div>
                    </div>
                </main>
            </div>

            <!-- Order Details Modal -->
            <div id="order-modal" class="fixed inset-0 z-50 hidden">
                <div class="fixed inset-0 bg-black bg-opacity-25"></div>
                <div class="fixed inset-0 flex items-center justify-center p-3 sm:p-4">
                    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                        <div class="p-4 sm:p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-base sm:text-lg font-semibold">Order Details</h3>
                                <button id="close-modal" class="text-gray-400 hover:text-gray-600">
                                    <i data-lucide="x" class="w-5 h-5 sm:w-6 sm:h-6"></i>
                                </button>
                            </div>
                            <div id="order-details">
                                <!-- Order details will be loaded here -->
                            </div>
                            <div class="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button id="update-status-btn" class="btn btn-primary text-sm sm:text-base w-full sm:w-auto">Update Status</button>
                                <button id="close-modal-btn" class="btn btn-outline text-sm sm:text-base w-full sm:w-auto">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Status Update Modal -->
            <div id="status-modal" class="fixed inset-0 z-50 hidden">
                <div class="fixed inset-0 bg-black bg-opacity-25"></div>
                <div class="fixed inset-0 flex items-center justify-center p-3 sm:p-4">
                    <div class="bg-white rounded-lg max-w-md w-full">
                        <div class="p-4 sm:p-6">
                            <h3 class="text-base sm:text-lg font-semibold mb-4">Update Order Status</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                                    <select id="status-select" class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                        <option value="picked_up">Picked Up</option>
                                        <option value="out_for_delivery">Out for Delivery</option>
                                        <option value="delivered">Delivered</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                    <textarea id="delivery-notes" class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" rows="3" placeholder="Add delivery notes..."></textarea>
                                </div>
                            </div>
                            <div class="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button id="save-status-btn" class="btn btn-primary text-sm sm:text-base w-full sm:w-auto">Update Status</button>
                                <button id="cancel-status-btn" class="btn btn-outline text-sm sm:text-base w-full sm:w-auto">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        initIcons();
        this.attachEventListeners();
    }

    renderOrders() {
        const statusIconMap = {
            pending: 'clock',
            picked_up: 'package',
            out_for_delivery: 'truck',
            delivered: 'check-circle'
        };

        const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
        const formatTotal = (order) => formatCurrency(order.total_amount ?? order.totalAmount ?? order.total ?? 0);

        const activeOrdersHtml = this.orders.length === 0
            ? `
                <div class="delivery-section__empty">
                    <i data-lucide="package" class="w-12 h-12 text-emerald-300 mx-auto mb-3"></i>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">No active deliveries</h3>
                    <p class="text-gray-600">New customer orders will appear here.</p>
            </div>
            `
            : `
                <div class="delivery-section__grid">
                    ${this.orders.map(order => {
                        const paymentStatus = (order.payment_status || order.paymentStatus || '').toString().toLowerCase();
                        const legacyMethod = (order.payment_method || order.paymentMethod || '').toString().toLowerCase();
                        const isPaid = paymentStatus === 'paid' || legacyMethod === 'online';
                        const paymentLabel = isPaid ? 'Paid Online' : 'Cash on Delivery';
                        const paymentIcon = isPaid ? 'credit-card' : 'wallet';
                        const statusIcon = statusIconMap[order.delivery_status] || 'truck';
                        const customerPhone = order.customer_mobile || '';
                        const orderTotal = formatTotal(order);
                        return `
                        <div class="delivery-order-card">
                            <header class="delivery-order-card__header">
                                <div>
                                    <p class="delivery-order-card__label">Order ID</p>
                                    <h3 class="delivery-order-card__title">#${order.id}</h3>
                        </div>
                                <div class="delivery-order-card__status">
                                    <span class="delivery-order-card__amount">${orderTotal}</span>
                                    <div class="delivery-order-card__chips">
                                        <span class="delivery-chip ${this.getDeliveryStatusClass(order.delivery_status)}">
                                            <i data-lucide="${statusIcon}" class="w-3.5 h-3.5"></i>
                                            ${this.getDeliveryStatusText(order.delivery_status)}
                                        </span>
                                        <span class="delivery-chip delivery-chip--payment ${isPaid ? 'delivery-chip--paid' : 'delivery-chip--cod'}">
                                            <i data-lucide="${paymentIcon}" class="w-3.5 h-3.5"></i>
                                            ${paymentLabel}
                                        </span>
                        </div>
                        </div>
                            </header>
                            <ul class="delivery-order-meta">
                                <li class="delivery-order-meta__item">
                                    <i data-lucide="user" class="w-4 h-4"></i>
                                    <span><strong>Customer</strong>${order.customer_name || '—'}</span>
                                </li>
                                ${customerPhone ? `
                                    <li class="delivery-order-meta__item">
                                        <i data-lucide="phone" class="w-4 h-4"></i>
                                        <span>
                                            <strong>Contact</strong>
                                            <a href="tel:${customerPhone}" class="delivery-order-link">${customerPhone}</a>
                        </span>
                                    </li>` : ''}
                                <li class="delivery-order-meta__item">
                                    <i data-lucide="map-pin" class="w-4 h-4"></i>
                                    <span><strong>Address</strong>${order.customer_address || '—'}</span>
                                </li>
                                <li class="delivery-order-meta__item">
                                    <i data-lucide="calendar" class="w-4 h-4"></i>
                                    <span><strong>Placed</strong>${formatDate(order.created_at)}</span>
                                </li>
                            </ul>
                            ${this.renderOrderItems(order)}
                            <footer class="delivery-order-card__actions">
                                <button class="btn btn-primary" onclick="app.currentDashboard.viewOrderDetails('${order.id}')">
                                    <i data-lucide="eye" class="w-4 h-4 mr-2"></i>
                            View Details
                        </button>
                                ${customerPhone ? `
                                    <a href="tel:${customerPhone}" class="btn btn-outline">
                                        <i data-lucide="phone-call" class="w-4 h-4 mr-2"></i>
                                        Call Customer
                                    </a>
                                ` : ''}
                            </footer>
                    </div>
                        `;
                    }).join('')}
                </div>
            `;

        const previousOrdersHtml = this.previousOrders.length === 0
            ? `
                <div class="delivery-section__empty">
                    <i data-lucide="check-circle" class="w-12 h-12 text-emerald-300 mx-auto mb-3"></i>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">No completed deliveries</h3>
                    <p class="text-gray-600">Delivered orders will appear here for quick reference.</p>
            </div>
            `
            : `
                <div class="delivery-section__grid">
                    ${this.previousOrders.map(order => {
                        const paymentStatus = (order.payment_status || order.paymentStatus || '').toString().toLowerCase();
                        const legacyMethod = (order.payment_method || order.paymentMethod || '').toString().toLowerCase();
                        const isPaid = paymentStatus === 'paid' || legacyMethod === 'online';
                        const paymentLabel = isPaid ? 'Paid Online' : 'Cash on Delivery';
                        const paymentIcon = isPaid ? 'credit-card' : 'wallet';
                        const deliveredDate = order.delivered_at || order.paid_at || order.updated_at;
                        return `
                        <div class="delivery-order-card delivery-order-card--muted">
                            <header class="delivery-order-card__header">
                                <div>
                                    <p class="delivery-order-card__label">Order ID</p>
                                    <h3 class="delivery-order-card__title">#${order.id}</h3>
                        </div>
                                <div class="delivery-order-card__status">
                                    <span class="delivery-order-card__amount">${formatTotal(order)}</span>
                                    <div class="delivery-order-card__chips">
                                        <span class="delivery-chip delivery-chip--status delivery-chip--delivered">
                                            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                            Delivered
                        </span>
                                        <span class="delivery-chip delivery-chip--payment ${isPaid ? 'delivery-chip--paid' : 'delivery-chip--cod'}">
                                            <i data-lucide="${paymentIcon}" class="w-3.5 h-3.5"></i>
                                            ${paymentLabel}
                                        </span>
                    </div>
                </div>
                            </header>
                            <ul class="delivery-order-meta">
                                <li class="delivery-order-meta__item">
                                    <i data-lucide="user" class="w-4 h-4"></i>
                                    <span><strong>Customer</strong>${order.customer_name || '—'}</span>
                                </li>
                                ${order.customer_mobile ? `
                                    <li class="delivery-order-meta__item">
                                        <i data-lucide="phone" class="w-4 h-4"></i>
                                        <span><strong>Contact</strong>${order.customer_mobile}</span>
                                    </li>` : ''}
                                <li class="delivery-order-meta__item">
                                    <i data-lucide="map-pin" class="w-4 h-4"></i>
                                    <span><strong>Address</strong>${order.customer_address || '—'}</span>
                                </li>
                                <li class="delivery-order-meta__item">
                                    <i data-lucide="calendar" class="w-4 h-4"></i>
                                    <span><strong>Delivered</strong>${formatDate(deliveredDate || order.created_at)}</span>
                                </li>
                            </ul>
                ${this.renderOrderItems(order)}
                            <footer class="delivery-order-card__actions">
                                <button class="btn btn-outline" onclick="app.currentDashboard.viewOrderDetails('${order.id}')">
                                    <i data-lucide="eye" class="w-4 h-4 mr-2"></i>
                                    View Details
                                </button>
                            </footer>
            </div>
                        `;
                    }).join('')}
                </div>
            `;

        return `
            <section class="delivery-section">
                <div class="delivery-section__header">
                    <div>
                        <h2>Active Deliveries</h2>
                        <p>Orders awaiting your action</p>
                </div>
                    <span class="delivery-section__badge">
                        ${this.orders.length} Active
                    </span>
                </div>
                ${activeOrdersHtml}
            </section>

            <section class="delivery-section">
                <div class="delivery-section__header">
            <div>
                        <h2>Completed</h2>
                        <p>Delivered orders for quick reference</p>
                </div>
                    <span class="delivery-section__badge delivery-section__badge--muted">
                        ${this.previousOrders.length} Delivered
                    </span>
                </div>
                ${previousOrdersHtml}
            </section>
        `;
    }

    getStats() {
        return {
            pending: this.orders.filter(o => o.delivery_status === 'pending').length,
            picked_up: this.orders.filter(o => o.delivery_status === 'picked_up').length,
            out_for_delivery: this.orders.filter(o => o.delivery_status === 'out_for_delivery').length,
            delivered: this.previousOrders.length
        };
    }

    getDeliveryStatusText(status) {
        const statusMap = {
            'pending': 'Pending Pickup',
            'picked_up': 'Picked Up',
            'out_for_delivery': 'Out for Delivery',
            'delivered': 'Delivered'
        };
        return statusMap[status] || status;
    }

    getDeliveryStatusClass(status) {
        const statusColors = {
            'pending': 'delivery-chip--status delivery-chip--pending',
            'picked_up': 'delivery-chip--status delivery-chip--picked_up',
            'out_for_delivery': 'delivery-chip--status delivery-chip--out_for_delivery',
            'delivered': 'delivery-chip--status delivery-chip--delivered'
        };
        return statusColors[status] || 'delivery-chip--status';
    }

    renderOrderItems(order) {
        console.log('Rendering order items for order:', order.id, order);
        
        // ALWAYS prioritize the actual items from the order over enhanced view data
        // This ensures we show what was actually ordered, not what the view thinks it is
        
        // Handle items array (multi-item orders) - ALWAYS use this for accurate product display
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            console.log('Using items array:', order.items.length, 'items');
            return `
                <div class="delivery-order-items">
                    <div class="delivery-order-items__header">
                        <i data-lucide="package" class="w-4 h-4"></i>
                        <span>Items to Deliver (${order.items.length})</span>
                    </div>
                    ${order.items.map(item => `
                        <div class="delivery-order-item">
                            <div class="delivery-order-item__thumb">
                                <img src="${item.image || 'https://images.unsplash.com/photo-1605027990121-75fd594d6565?w=400'}" alt="${item.name || 'Product'}">
                                </div>
                            <div class="delivery-order-item__details">
                                <span class="delivery-order-item__name">${item.name || 'Product'}</span>
                                <span class="delivery-order-item__meta">Qty: ${item.quantity || 1} × ${formatCurrency(item.price || item.product_price || 0)}</span>
                            </div>
                            <div class="delivery-order-item__amount">
                                ${formatCurrency((item.price || item.product_price || 0) * (item.quantity || 1))}
                    </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // No product information available
        console.log('No product information available for order:', order.id);
        return `
            <div class="delivery-order-items">
                <div class="delivery-order-items__header delivery-order-items__header--muted">
                    <i data-lucide="package" class="w-4 h-4"></i>
                    <span>Product details not available</span>
                </div>
                <div class="delivery-order-item delivery-order-item--muted">
                    <div class="delivery-order-item__details">
                        <span class="delivery-order-item__name">Order total</span>
                        <span class="delivery-order-item__meta">Awaiting detailed breakdown</span>
                    </div>
                    <div class="delivery-order-item__amount">
                        ${formatCurrency(order.total_amount || order.total || 0)}
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadOrders().then(() => {
                this.render();
            });
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.authManager.signOut();
        });

        // Modal close buttons
        document.getElementById('close-modal').addEventListener('click', () => this.closeOrderModal());
        document.getElementById('close-modal-btn').addEventListener('click', () => this.closeOrderModal());
        document.getElementById('cancel-status-btn').addEventListener('click', () => this.closeStatusModal());

        // Status update
        document.getElementById('update-status-btn').addEventListener('click', () => this.openStatusModal());
        document.getElementById('save-status-btn').addEventListener('click', () => this.updateOrderStatus());
    }
    async viewOrderDetails(orderId) {
        try {
            const { data: order, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();
            
            if (error) {
                console.error('Error loading order details:', error);
                return;
            }
            
            this.currentOrder = order;
            this.showOrderModal(order);
            
        } catch (error) {
            console.error('Error loading order details:', error);
        }
    }
    showOrderModal(order) {
        const modal = document.getElementById('order-modal');
        const details = document.getElementById('order-details');
        
        details.innerHTML = `
            <div class="space-y-3 sm:space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700">Order ID</label>
                        <p class="text-xs sm:text-sm text-gray-900 break-all">${order.id}</p>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700">Status</label>
                        <p class="text-xs sm:text-sm text-gray-900">${this.getDeliveryStatusText(order.delivery_status)}</p>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700">Customer Name</label>
                        <p class="text-xs sm:text-sm text-gray-900">${order.customer_name}</p>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700">Mobile</label>
                        <p class="text-xs sm:text-sm text-gray-900">${order.customer_mobile}</p>
                    </div>
                </div>
                <div>
                    <label class="block text-xs sm:text-sm font-medium text-gray-700">Address</label>
                    <p class="text-xs sm:text-sm text-gray-900 break-words">${order.customer_address}</p>
                    <p class="text-xs sm:text-sm text-gray-600">${order.customer_landmark}, ${order.customer_pincode}</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700">Total Amount</label>
                        <p class="text-xs sm:text-sm text-gray-900">₹${order.total_amount}</p>
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700">Order Date</label>
                        <p class="text-xs sm:text-sm text-gray-900">${new Date(order.created_at).toLocaleString()}</p>
                    </div>
                </div>
                ${order.delivery_notes ? `
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700">Delivery Notes</label>
                        <p class="text-xs sm:text-sm text-gray-900 break-words">${order.delivery_notes}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    closeOrderModal() {
        document.getElementById('order-modal').classList.add('hidden');
    }

    openStatusModal() {
        document.getElementById('status-modal').classList.remove('hidden');
    }

    closeStatusModal() {
        document.getElementById('status-modal').classList.add('hidden');
    }

    async updateOrderStatus() {
        const newStatus = document.getElementById('status-select').value;
        const notes = document.getElementById('delivery-notes').value;
        
        if (!this.currentOrder) {
            alert('No order selected');
            return;
        }
        
        try {
            const agent = this.authManager.getUser();
            
            // Update order status
            const statusUpdates = {
                    delivery_status: newStatus,
                    delivery_agent_id: agent.id,
                    delivery_notes: notes,
                    picked_up_at: newStatus === 'picked_up' ? new Date().toISOString() : this.currentOrder.picked_up_at,
                    out_for_delivery_at: newStatus === 'out_for_delivery' ? new Date().toISOString() : this.currentOrder.out_for_delivery_at,
                    delivered_at: newStatus === 'delivered' ? new Date().toISOString() : this.currentOrder.delivered_at,
                    updated_at: new Date().toISOString()
            };

            if (newStatus === 'delivered') {
                statusUpdates.status = 'delivered';
                statusUpdates.payment_status = this.currentOrder.payment_status || 'paid';
            } else if (newStatus === 'out_for_delivery') {
                statusUpdates.status = 'out_for_delivery';
            } else if (newStatus === 'picked_up' && this.currentOrder.status === 'pending') {
                statusUpdates.status = 'confirmed';
            }

            const { error } = await supabase
                .from('orders')
                .update(statusUpdates)
                .eq('id', this.currentOrder.id);
            
            if (error) {
                console.error('Error updating order status:', error);
                alert('Failed to update order status');
                return;
            }
            
            alert('Order status updated successfully!');
            this.closeStatusModal();
            this.closeOrderModal();
            await this.loadOrders();
            this.render();
            
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status');
        }
    }
}
// ===== ADMIN DASHBOARD =====
class AdminDashboard {
    constructor(authManager) {
        this.authManager = authManager;
        this.products = [];
        this.orders = [];
        this.agents = [];
        this.activeTab = 'overview';
    }

    async init() {
        await this.loadData();
        this.render();
    }

    async loadData() {
        try {
            // Load products directly from Supabase
            if (supabase && supabaseReady) {
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (productsError) {
                    console.error('Error loading products from Supabase:', productsError);
                    this.products = [];
                } else {
                    this.products = productsData || [];
                }
            } else {
                // Fallback to API if Supabase not ready
                const productsRes = await api.getProducts();
                this.products = productsRes.products || [];
            }
            
            // Load orders
            const token = this.authManager.getToken();
            const ordersRes = await api.getOrders(token);
            this.orders = ordersRes.orders || [];
            
            // Load delivery agents from Supabase
            if (supabase && supabaseReady) {
                const { data: agents, error } = await supabase
                    .from('delivery_agents')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Error loading delivery agents:', error);
                } else {
                    this.agents = agents || [];
                }
            } else {
                this.agents = [];
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        }
    }

    async seedProducts() {
        const loadingToast = toast.loading('Adding sample products...');
        try {
            let count = 0;
            
            if (supabase && supabaseReady) {
                for (const product of sampleProducts) {
                    // Use Supabase directly for seeding
                    const { error } = await supabase
                        .from('products')
                        .insert([product]);
                    
                    if (error) {
                        console.error('Error seeding product:', error);
                    } else {
                        count++;
                    }
                }
            } else {
                // Fallback to API
                const token = this.authManager.getToken();
                for (const product of sampleProducts) {
                    await api.createProduct(product, token);
                    count++;
                }
            }
            
            toast.dismiss(loadingToast);
            toast.success(`Added ${count} sample products!`);
            await this.loadData();
            this.render();
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Failed to add sample products');
        }
    }

    render() {
        const app = document.getElementById('app');
        if (!app) {
            console.error('App element not found');
            return;
        }
        console.log('AdminDashboard render called, agents count:', this.agents.length);
        app.innerHTML = `
            <div class="min-h-screen bg-gray-50">
                <!-- Header -->
                <header class="bg-white shadow-sm border-b">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between items-center h-16">
                            <div class="flex items-center">
                                <h1 class="text-2xl font-bold text-emerald-600">Admin Dashboard</h1>
                            </div>
                            <div class="flex items-center space-x-4">
                                <button id="create-main-category" class="btn btn-outline">Create Main Category</button>
                                <button id="make-all-instock" class="btn btn-primary">Make All In Stock</button>
                                <button id="seed-products" class="btn btn-outline">Add Sample Products</button>
                                <button id="logout-btn" class="btn btn-outline">Sign Out</button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <!-- Stats -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div class="flex items-center">
                                <div class="p-2 bg-emerald-100 rounded-lg">
                                    <i data-lucide="package" class="w-6 h-6 text-emerald-600"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Total Products</p>
                                    <p class="text-2xl font-semibold text-gray-900">${this.products.length}</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div class="flex items-center">
                                <div class="p-2 bg-blue-100 rounded-lg">
                                    <i data-lucide="shopping-cart" class="w-6 h-6 text-blue-600"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Total Orders</p>
                                    <p class="text-2xl font-semibold text-gray-900">${this.orders.length}</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div class="flex items-center">
                                <div class="p-2 bg-purple-100 rounded-lg">
                                    <i data-lucide="truck" class="w-6 h-6 text-purple-600"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-600">Delivery Agents</p>
                                    <p class="text-2xl font-semibold text-gray-900">${this.agents.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Add Product Form -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <h2 class="text-lg font-semibold text-gray-900">Add New Product</h2>
                        </div>
                        <div class="p-6">
                            <form id="add-product-form" class="space-y-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                                        <input type="text" id="product-name" required 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="Enter product name">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Main Category Card *</label>
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                            ${mainCategories.map(category => `
                                                <div class="main-category-select-card border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-emerald-400 transition-colors" 
                                                     data-category-id="${category.id}">
                                                    <div class="flex items-center space-x-3">
                                                        <div class="w-8 h-8 rounded-lg ${category.color} flex items-center justify-center">
                                                            <i data-lucide="${category.icon}" class="w-4 h-4 text-white"></i>
                                                        </div>
                                                        <div>
                                                            <h4 class="text-sm font-medium text-gray-900">${category.name}</h4>
                                                            <p class="text-xs text-gray-500">${category.subcategories.length} subcategories</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                        <input type="hidden" id="product-main-category" name="product-main-category">
                                    </div>
                                    <div>
                                        <div class="flex items-center justify-between mb-2">
                                            <label class="block text-sm font-medium text-gray-700">Subcategory *</label>
                                            <button type="button" id="create-category-btn" class="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                                                + Create New Category
                                            </button>
                                        </div>
                                        <select id="product-category" required 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                            <option value="">Select Subcategory</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                    <textarea id="product-description" required rows="3"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Enter product description"></textarea>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                                        <input type="number" id="product-price" required min="0" step="0.01"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="0.00">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                                        <input type="number" id="product-stock" required min="0"
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            placeholder="0">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                                        <select id="product-status" required 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                            <option value="in_stock">In Stock</option>
                                            <option value="out_of_stock">Out of Stock</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Product Image *</label>
                                    <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-emerald-400 transition-colors">
                                        <div class="space-y-1 text-center">
                                            <i data-lucide="upload" class="mx-auto h-12 w-12 text-gray-400"></i>
                                            <div class="flex text-sm text-gray-600">
                                                <label for="product-image-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                                                    <span>Upload a file</span>
                                                    <input id="product-image-upload" name="product-image-upload" type="file" accept="image/*" class="sr-only">
                                                </label>
                                                <p class="pl-1">or drag and drop</p>
                                            </div>
                                            <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                        </div>
                                    </div>
                                    <div id="product-image-preview" class="mt-3 hidden">
                                        <img id="product-image-preview-img" class="mx-auto h-32 w-32 object-cover rounded-lg">
                                        <button type="button" id="remove-product-image" class="mt-2 text-sm text-red-600 hover:text-red-500">Remove Image</button>
                                    </div>
                                    <input type="hidden" id="product-image" name="product-image">
                                </div>
                                
                                <div class="flex justify-end space-x-3">
                                    <button type="reset" class="btn btn-outline">Clear Form</button>
                                    <button type="submit" class="btn btn-primary">Add Product</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Edit Product Modal -->
                    <div id="edit-product-modal" class="fixed inset-0 z-50 hidden">
                        <div class="fixed inset-0 bg-black bg-opacity-25" id="edit-modal-overlay"></div>
                        <div class="fixed inset-0 flex items-center justify-center p-4">
                            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div class="px-6 py-4 border-b border-gray-200">
                                    <div class="flex items-center justify-between">
                                        <h2 class="text-lg font-semibold text-gray-900">Edit Product</h2>
                                        <button id="close-edit-modal" class="text-gray-400 hover:text-gray-600">
                                            <i data-lucide="x" class="w-6 h-6"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="p-6">
                                    <form id="edit-product-form" class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                                            <input type="text" id="edit-product-name" required 
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                placeholder="Enter product name">
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Main Category Card *</label>
                                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                                ${mainCategories.map(category => `
                                                    <div class="edit-main-category-select-card border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-emerald-400 transition-colors" 
                                                         data-category-id="${category.id}">
                                                        <div class="flex items-center space-x-3">
                                                            <div class="w-8 h-8 rounded-lg ${category.color} flex items-center justify-center">
                                                                <i data-lucide="${category.icon}" class="w-4 h-4 text-white"></i>
                                                            </div>
                                                            <div>
                                                                <h4 class="text-sm font-medium text-gray-900">${category.name}</h4>
                                                                <p class="text-xs text-gray-500">${category.subcategories.length} subcategories</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                            <input type="hidden" id="edit-product-main-category" name="edit-product-main-category">
                                        </div>
                                        
                                        <div>
                                            <div class="flex items-center justify-between mb-2">
                                                <label class="block text-sm font-medium text-gray-700">Subcategory *</label>
                                                <button type="button" id="edit-create-category-btn" class="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                                                    + Create New Category
                                                </button>
                                            </div>
                                            <select id="edit-product-category" required 
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                                <option value="">Select Subcategory</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                            <textarea id="edit-product-description" required rows="3"
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                placeholder="Enter product description"></textarea>
                                        </div>
                                        
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                                                <input type="number" id="edit-product-price" required min="0" step="0.01"
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    placeholder="0.00">
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                                                <input type="number" id="edit-product-stock" required min="0"
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                    placeholder="0">
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                                                <select id="edit-product-status" required 
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                                    <option value="in_stock">In Stock</option>
                                                    <option value="out_of_stock">Out of Stock</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Product Image *</label>
                                            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-emerald-400 transition-colors">
                                                <div class="space-y-1 text-center">
                                                    <i data-lucide="upload" class="mx-auto h-12 w-12 text-gray-400"></i>
                                                    <div class="flex text-sm text-gray-600">
                                                        <label for="edit-product-image-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                                                            <span>Upload a file</span>
                                                            <input id="edit-product-image-upload" name="edit-product-image-upload" type="file" accept="image/*" class="sr-only">
                                                        </label>
                                                        <p class="pl-1">or drag and drop</p>
                                                    </div>
                                                    <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                                </div>
                                            </div>
                                            <div id="edit-product-image-preview" class="mt-3">
                                                <img id="edit-product-image-preview-img" class="mx-auto h-32 w-32 object-cover rounded-lg">
                                                <button type="button" id="remove-edit-product-image" class="mt-2 text-sm text-red-600 hover:text-red-500">Remove Image</button>
                                            </div>
                                            <input type="hidden" id="edit-product-image" name="edit-product-image">
                                        </div>
                                        
                                        <div class="flex justify-end space-x-3">
                                            <button type="button" id="cancel-edit" class="btn btn-outline">Cancel</button>
                                            <button type="submit" class="btn btn-primary">Update Product</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Products -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <h2 class="text-lg font-semibold text-gray-900">Products (${this.products.length})</h2>
                        </div>
                        <div class="p-6">
                            ${this.products.length === 0 ? `
                                <div class="text-center py-8">
                                    <i data-lucide="package" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                                    <p class="text-gray-500 mb-4">No products yet</p>
                                    <button id="add-sample-products" class="btn btn-primary">Add Sample Products</button>
                                </div>
                            ` : `
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    ${this.products.map(product => `
                                        <div class="border border-gray-200 rounded-lg p-4 ${(product.stock_quantity === 0 || product.status === 'out_of_stock') ? 'opacity-60' : ''}">
                                            <div style="height: 180px; width: 100%; overflow: hidden; border-radius: 0.375rem; margin-bottom: 0.75rem;"><img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;"></div>
                                            <h3 class="font-semibold text-gray-900 mb-2">${product.name}</h3>
                                            <p class="text-gray-600 text-sm mb-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${product.description || ''}</p>
                                            <div class="product-price-display">
                                                <span class="product-price-amount">${formatCurrency(product.price)}</span>
                                                <span class="product-price-stock">${product.stock_quantity !== undefined ? `Stock: ${product.stock_quantity}` : ''}</span>
                                            </div>
                                            <div class="flex space-x-2">
                                                <button class="edit-product-btn btn btn-outline text-xs" data-id="${product.id}" data-product='${JSON.stringify(product)}'>Edit</button>
                                                <button class="delete-product-btn btn btn-destructive text-xs" data-id="${product.id}">Delete</button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Delivery Agents Management -->
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <div class="flex items-center justify-between">
                                <h2 class="text-lg font-semibold text-gray-900">Delivery Agents</h2>
                                <button id="add-delivery-agent" class="btn btn-primary">
                                    <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                                    Add Agent
                                </button>
                            </div>
                        </div>
                        <div class="p-6">
                            <div id="delivery-agents-list">
                                <!-- Delivery agents will be rendered here -->
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        `;

        initIcons();
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Add product form
        const addProductForm = document.getElementById('add-product-form');
        if (addProductForm) {
            addProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddProduct();
            });
        }

        // Auto-update status based on stock quantity
        const stockInput = document.getElementById('product-stock');
        const statusSelect = document.getElementById('product-status');
        if (stockInput && statusSelect) {
            stockInput.addEventListener('input', (e) => {
                const stock = parseInt(e.target.value) || 0;
                if (stock === 0) {
                    statusSelect.value = 'out_of_stock';
                } else {
                    statusSelect.value = 'in_stock';
                }
            });

            // Auto-update stock quantity based on status
            statusSelect.addEventListener('change', (e) => {
                const status = e.target.value;
                if (status === 'out_of_stock') {
                    stockInput.value = 0;
                } else if (status === 'in_stock' && (parseInt(stockInput.value) || 0) === 0) {
                    stockInput.value = 1; // Set minimum stock of 1 for in_stock
                }
            });
        }

        // Image upload handling for add product form
        this.setupImageUpload('product-image-upload', 'product-image-preview', 'product-image-preview-img', 'remove-product-image', 'product-image');

        // Category card selection for add product form
        this.setupCategoryCardSelection('main-category-select-card', 'product-main-category', 'product-category');

        // Create category button for add product form
        const createCategoryBtn = document.getElementById('create-category-btn');
        if (createCategoryBtn) {
            createCategoryBtn.addEventListener('click', () => {
                this.openCreateCategoryModal('product-main-category', 'product-category');
            });
        }

        // Edit product form
        const editProductForm = document.getElementById('edit-product-form');
        if (editProductForm) {
            editProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditProduct();
            });
        }

        // Auto-update status for edit form
        const editStockInput = document.getElementById('edit-product-stock');
        const editStatusSelect = document.getElementById('edit-product-status');
        if (editStockInput && editStatusSelect) {
            editStockInput.addEventListener('input', (e) => {
                const stock = parseInt(e.target.value) || 0;
                if (stock === 0) {
                    editStatusSelect.value = 'out_of_stock';
                } else {
                    editStatusSelect.value = 'in_stock';
                }
            });

            // Auto-update stock quantity based on status
            editStatusSelect.addEventListener('change', (e) => {
                const status = e.target.value;
                if (status === 'out_of_stock') {
                    editStockInput.value = 0;
                } else if (status === 'in_stock' && (parseInt(editStockInput.value) || 0) === 0) {
                    editStockInput.value = 1; // Set minimum stock of 1 for in_stock
                }
            });
        }

        // Image upload handling for edit product form
        this.setupImageUpload('edit-product-image-upload', 'edit-product-image-preview', 'edit-product-image-preview-img', 'remove-edit-product-image', 'edit-product-image');

        // Category card selection for edit product form
        this.setupCategoryCardSelection('edit-main-category-select-card', 'edit-product-main-category', 'edit-product-category');

        // Create category button for edit product form
        const editCreateCategoryBtn = document.getElementById('edit-create-category-btn');
        if (editCreateCategoryBtn) {
            editCreateCategoryBtn.addEventListener('click', () => {
                this.openCreateCategoryModal('edit-product-main-category', 'edit-product-category');
            });
        }

        // Edit product buttons
        document.querySelectorAll('.edit-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productData = JSON.parse(e.target.dataset.product);
                this.openEditModal(productData);
            });
        });

        // Delete product buttons
        document.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                this.handleDeleteProduct(productId);
            });
        });

        // Close edit modal
        const closeEditModal = document.getElementById('close-edit-modal');
        const cancelEdit = document.getElementById('cancel-edit');
        const editModalOverlay = document.getElementById('edit-modal-overlay');
        const editModal = document.getElementById('edit-product-modal');

        if (closeEditModal) {
            closeEditModal.addEventListener('click', () => this.closeEditModal());
        }
        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => this.closeEditModal());
        }
        if (editModalOverlay) {
            editModalOverlay.addEventListener('click', () => this.closeEditModal());
        }

        // Create main category
        const createMainCategoryBtn = document.getElementById('create-main-category');
        if (createMainCategoryBtn) {
            createMainCategoryBtn.addEventListener('click', () => this.openCreateMainCategoryModal());
        }

        // Make all in stock
        const makeAllInStockBtn = document.getElementById('make-all-instock');
        if (makeAllInStockBtn) {
            makeAllInStockBtn.addEventListener('click', () => this.makeAllInStock());
        }

        // Seed products
        const seedBtn = document.getElementById('seed-products');
        const addSampleBtn = document.getElementById('add-sample-products');
        if (seedBtn) seedBtn.addEventListener('click', () => this.seedProducts());
        if (addSampleBtn) addSampleBtn.addEventListener('click', () => this.seedProducts());

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.authManager.signOut();
        });

        // Delivery agent management
        this.setupDeliveryAgentManagement();
    }

    setupDeliveryAgentManagement() {
        console.log('Setting up delivery agent management...');
        // Add delivery agent button
        const addDeliveryAgentBtn = document.getElementById('add-delivery-agent');
        console.log('Add delivery agent button found:', !!addDeliveryAgentBtn);
        if (addDeliveryAgentBtn) {
            addDeliveryAgentBtn.addEventListener('click', () => {
                this.openAddDeliveryAgentModal();
            });
        }

        // Load delivery agents
        this.loadDeliveryAgents();
    }

    async loadDeliveryAgents() {
        try {
            if (supabase && supabaseReady) {
                const { data: agents, error } = await supabase
                    .from('delivery_agents')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error('Error loading delivery agents:', error);
                    return;
                }
                
                this.agents = agents || [];
                this.renderDeliveryAgents();
            }
        } catch (error) {
            console.error('Error loading delivery agents:', error);
        }
    }
    renderDeliveryAgents() {
        const container = document.getElementById('delivery-agents-list');
        if (!container) return;

        if (this.agents.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i data-lucide="truck" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">No delivery agents</h3>
                    <p class="text-gray-600">Add your first delivery agent to get started.</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }

        const agentsHtml = this.agents.map(agent => `
            <div class="border border-gray-200 rounded-lg p-4 mb-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full flex items-center justify-center">
                            <i data-lucide="user" class="w-6 h-6 text-white"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">${agent.name}</h3>
                            <p class="text-sm text-gray-600">ID: ${agent.agent_id}</p>
                            <p class="text-sm text-gray-600">${agent.email || agent.mobile}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span class="px-3 py-1 rounded-full text-sm font-medium ${
                            agent.status === 'active' ? 'bg-green-100 text-green-800' : 
                            agent.status === 'busy' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                        }">
                            ${agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                        </span>
                        <button class="text-red-600 hover:text-red-700 text-sm" onclick="app.currentDashboard.deleteDeliveryAgent('${agent.id}')">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = agentsHtml;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    openAddDeliveryAgentModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-md w-full mx-4">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold">Add Delivery Agent</h3>
                        <button id="close-agent-modal" class="text-gray-400 hover:text-gray-600">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>
                    <form id="add-agent-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Agent ID</label>
                            <div class="flex space-x-2">
                                <input type="text" id="agent-id" required
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="e.g., DEL001">
                                <button type="button" id="generate-agent-id" class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                                    Generate
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input type="text" id="agent-name" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Enter agent name">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" id="agent-email"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Enter email (optional)">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
                            <input type="tel" id="agent-mobile"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Enter mobile number (optional)">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input type="password" id="agent-password" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Enter password">
                        </div>
                        <div class="flex space-x-3">
                            <button type="submit" class="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors">
                                Add Agent
                            </button>
                            <button type="button" id="cancel-agent" class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Event listeners
        document.getElementById('close-agent-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('cancel-agent').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('add-agent-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddDeliveryAgent();
        });

        // Generate unique agent ID
        document.getElementById('generate-agent-id').addEventListener('click', () => {
            const timestamp = Date.now();
            const randomNum = Math.floor(Math.random() * 1000);
            const agentId = `DEL${timestamp.toString().slice(-6)}${randomNum}`;
            document.getElementById('agent-id').value = agentId;
        });
    }
    async handleAddDeliveryAgent() {
        try {
            const agentId = document.getElementById('agent-id').value.trim();
            const name = document.getElementById('agent-name').value.trim();
            const email = document.getElementById('agent-email').value.trim();
            const mobile = document.getElementById('agent-mobile').value.trim();
            const password = document.getElementById('agent-password').value;

            if (!agentId || !name || !password) {
                toast.error('Please fill in all required fields');
                return;
            }

            if (!email && !mobile) {
                toast.error('Please provide either email or mobile number');
                return;
            }

            const hashedPassword = btoa(password + 'mango_mart_salt');

            if (supabase && supabaseReady) {
                const { error } = await supabase
                    .from('delivery_agents')
                    .insert({
                        agent_id: agentId,
                        name: name,
                        email: email || null,
                        mobile: mobile || null,
                        password: hashedPassword,
                        status: 'active'
                    });

                if (error) {
                    console.error('Error creating delivery agent:', error);
                    if (error.code === '23505') {
                        toast.error('Agent ID already exists. Please use a different ID.');
                    } else {
                        toast.error('Failed to create delivery agent');
                    }
                    return;
                }

                toast.success('Delivery agent created successfully!');
                
                // Close modal
                const modal = document.querySelector('.fixed.inset-0.z-50');
                if (modal && modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }

                // Reload agents
                await this.loadDeliveryAgents();
            } else {
                toast.error('Database not available');
            }

        } catch (error) {
            console.error('Error creating delivery agent:', error);
            toast.error('Failed to create delivery agent');
        }
    }

    async deleteDeliveryAgent(agentId) {
        if (!confirm('Are you sure you want to delete this delivery agent?')) {
            return;
        }

        try {
            if (supabase && supabaseReady) {
                const { error } = await supabase
                    .from('delivery_agents')
                    .delete()
                    .eq('id', agentId);

                if (error) {
                    console.error('Error deleting delivery agent:', error);
                    toast.error('Failed to delete delivery agent');
                    return;
                }

                toast.success('Delivery agent deleted successfully!');
                await this.loadDeliveryAgents();
            } else {
                toast.error('Database not available');
            }

        } catch (error) {
            console.error('Error deleting delivery agent:', error);
            toast.error('Failed to delete delivery agent');
        }
    }

    async handleAddProduct() {
        try {
            const name = document.getElementById('product-name').value;
            const mainCategoryId = document.getElementById('product-main-category').value;
            const subcategory = document.getElementById('product-category').value;
            const description = document.getElementById('product-description').value;
            const price = parseFloat(document.getElementById('product-price').value);
            const stock = parseInt(document.getElementById('product-stock').value);
            const statusInput = document.getElementById('product-status').value;
            const image = document.getElementById('product-image').value;

            // Validate main category selection
            if (!mainCategoryId) {
                toast.error('Please select a main category card');
                return;
            }

            // Auto-set status based on stock
            let status = stock === 0 ? 'out_of_stock' : statusInput;

            const newProduct = {
                id: 'PROD' + Date.now(),
                name,
                main_category: mainCategoryId,
                subcategory: subcategory,
                description,
                price,
                stock_quantity: stock,
                status,
                image,
                created_at: new Date().toISOString()
            };

            const loadingToast = toast.loading('Adding product...');
            
            if (supabase && supabaseReady) {
                // Insert directly into Supabase
                const { data, error } = await supabase
                    .from('products')
                    .insert([newProduct])
                    .select()
                    .single();
                
                if (error) {
                    console.error('Supabase error:', error);
                    toast.dismiss(loadingToast);
                    toast.error('Failed to add product: ' + (error.message || 'Unknown error'));
                    return;
                }
            } else {
                // Fallback to API
                const token = this.authManager.getToken();
                await api.createProduct(newProduct, token);
            }
            
            toast.dismiss(loadingToast);
            toast.success('Product added successfully!');
            
            // Reset form
            document.getElementById('add-product-form').reset();
            document.getElementById('product-image-preview').classList.add('hidden');
            
            // Reload data and refresh
            await this.loadData();
            this.render();
            
            // Notify other dashboards to refresh their data
            this.notifyDataChange();
        } catch (error) {
            console.error('Error adding product:', error);
            toast.error('Failed to add product: ' + (error.message || 'Unknown error'));
        }
    }

    async openEditModal(product) {
        this.currentEditingProduct = product;
        
        // Populate form with product data
        document.getElementById('edit-product-name').value = product.name || '';
        document.getElementById('edit-product-description').value = product.description || '';
        document.getElementById('edit-product-price').value = product.price || '';
        document.getElementById('edit-product-stock').value = product.stock_quantity || 0;
        document.getElementById('edit-product-status').value = product.status || 'in_stock';
        
        // Handle category selection
        if (product.category) {
            const mainCategory = this.findMainCategoryFromSubcategory(product.category);
            if (mainCategory) {
                // Select the main category card
                const categoryCard = document.querySelector(`[data-category-id="${mainCategory.id}"]`);
                if (categoryCard) {
                    // Remove selection from all cards
                    document.querySelectorAll('.edit-main-category-select-card').forEach(c => 
                        c.classList.remove('border-emerald-500', 'bg-emerald-50'));
                    
                    // Add selection to the correct card
                    categoryCard.classList.add('border-emerald-500', 'bg-emerald-50');
                    
                    // Set hidden input
                    document.getElementById('edit-product-main-category').value = mainCategory.id;
                    
                    // Populate subcategories with newest first
                    const subcategorySelect = document.getElementById('edit-product-category');
                    subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
                    const subcategories = [...mainCategory.subcategories];
                    subcategories.reverse().forEach(subcategory => {
                        const option = document.createElement('option');
                        option.value = subcategory;
                        option.textContent = subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
                        if (subcategory === product.category) {
                            option.selected = true;
                        }
                        subcategorySelect.appendChild(option);
                    });
                }
            }
        }
        
        // Handle existing image
        if (product.image) {
            const editPreviewImg = document.getElementById('edit-product-image-preview-img');
            const editPreviewDiv = document.getElementById('edit-product-image-preview');
            const editHiddenInput = document.getElementById('edit-product-image');
            
            if (product.image.startsWith('data:')) {
                // Already a base64 image
                editPreviewImg.src = product.image;
                editHiddenInput.value = product.image;
            } else {
                // Convert URL to base64
                try {
                    const base64Image = await this.loadImageAsBase64(product.image);
                    editPreviewImg.src = base64Image;
                    editHiddenInput.value = base64Image;
                } catch (error) {
                    // Fallback to original URL
                    editPreviewImg.src = product.image;
                    editHiddenInput.value = product.image;
                }
            }
            editPreviewDiv.classList.remove('hidden');
        }
        
        // Show modal
        document.getElementById('edit-product-modal').classList.remove('hidden');
    }

    closeEditModal() {
        document.getElementById('edit-product-modal').classList.add('hidden');
        this.currentEditingProduct = null;
    }

    async handleEditProduct() {
        try {
            const name = document.getElementById('edit-product-name').value;
            const mainCategoryId = document.getElementById('edit-product-main-category').value;
            const subcategory = document.getElementById('edit-product-category').value;
            const description = document.getElementById('edit-product-description').value;
            const price = parseFloat(document.getElementById('edit-product-price').value);
            const stock = parseInt(document.getElementById('edit-product-stock').value);
            const statusInput = document.getElementById('edit-product-status').value;
            const image = document.getElementById('edit-product-image').value;

            // Validate main category selection
            if (!mainCategoryId) {
                toast.error('Please select a main category card');
                return;
            }

            // Auto-set status based on stock
            let status = stock === 0 ? 'out_of_stock' : statusInput;

            const updatedProduct = {
                name,
                main_category: mainCategoryId,
                subcategory: subcategory,
                description,
                price,
                stock_quantity: stock,
                status,
                image,
                updated_at: new Date().toISOString()
            };

            const loadingToast = toast.loading('Updating product...');
            
            if (supabase && supabaseReady) {
                // Update directly in Supabase
                const { data, error } = await supabase
                    .from('products')
                    .update(updatedProduct)
                    .eq('id', this.currentEditingProduct.id)
                    .select()
                    .single();
                
                if (error) {
                    console.error('Supabase error:', error);
                    toast.dismiss(loadingToast);
                    toast.error('Failed to update product: ' + (error.message || 'Unknown error'));
                    return;
                }
            } else {
                // Fallback to API
                const token = this.authManager.getToken();
                await api.updateProduct(this.currentEditingProduct.id, updatedProduct, token);
            }
            
            toast.dismiss(loadingToast);
            toast.success('Product updated successfully!');
            
            // Close modal
            this.closeEditModal();
            
            // Reload data and refresh
            await this.loadData();
            this.render();
            
            // Notify other dashboards to refresh their data
            this.notifyDataChange();
        } catch (error) {
            console.error('Error updating product:', error);
            toast.error('Failed to update product: ' + (error.message || 'Unknown error'));
        }
    }

    async handleDeleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        try {
            const loadingToast = toast.loading('Deleting product...');
            
            if (supabase && supabaseReady) {
                // Delete directly from Supabase
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', productId);
                
                if (error) {
                    console.error('Supabase error:', error);
                    toast.dismiss(loadingToast);
                    toast.error('Failed to delete product: ' + (error.message || 'Unknown error'));
                    return;
                }
            } else {
                // Fallback to API
                const token = this.authManager.getToken();
                await api.deleteProduct(productId, token);
            }
            
            toast.dismiss(loadingToast);
            toast.success('Product deleted successfully!');
            
            // Reload data and refresh
            await this.loadData();
            this.render();
            
            // Notify other dashboards to refresh their data
            this.notifyDataChange();
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product: ' + (error.message || 'Unknown error'));
        }
    }

    setupImageUpload(uploadInputId, previewDivId, previewImgId, removeBtnId, hiddenInputId) {
        const uploadInput = document.getElementById(uploadInputId);
        const previewDiv = document.getElementById(previewDivId);
        const previewImg = document.getElementById(previewImgId);
        const removeBtn = document.getElementById(removeBtnId);
        const hiddenInput = document.getElementById(hiddenInputId);

        if (!uploadInput || !previewDiv || !previewImg || !removeBtn || !hiddenInput) return;

        // Handle file selection
        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageUpload(file, previewImg, previewDiv, hiddenInput);
            }
        });

        // Handle drag and drop
        const uploadArea = uploadInput.closest('.border-dashed');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('border-emerald-400', 'bg-emerald-50');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('border-emerald-400', 'bg-emerald-50');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('border-emerald-400', 'bg-emerald-50');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleImageUpload(files[0], previewImg, previewDiv, hiddenInput);
                }
            });
        }

        // Handle remove image
        removeBtn.addEventListener('click', () => {
            this.removeImage(uploadInput, previewDiv, hiddenInput);
        });
    }

    handleImageUpload(file, previewImg, previewDiv, hiddenInput) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size must be less than 10MB');
            return;
        }

        // Load image and validate aspect ratio
        const img = new Image();
        img.onload = () => {
            // Check aspect ratio (16:9)
            const width = img.width;
            const height = img.height;
            const aspectRatio = width / height;
            const targetRatio = 16 / 9; // 1.777...
            const tolerance = 0.05; // 5% tolerance
            
            // Allow slight variations in aspect ratio
            if (Math.abs(aspectRatio - targetRatio) > tolerance) {
                const optimalWidth = 2560;
                const optimalHeight = 1440;
                const message = `Image aspect ratio must be 16:9 (current: ${aspectRatio.toFixed(2)}).\n\nRecommended dimensions: ${optimalWidth}×${optimalHeight}px\n\nAccepted range: ${(targetRatio - tolerance).toFixed(2)} to ${(targetRatio + tolerance).toFixed(2)}`;
                toast.error(message);
                console.warn('Image aspect ratio error:', { width, height, aspectRatio, targetRatio });
                return;
            }

            // Aspect ratio is correct, proceed with upload
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Data = e.target.result;
                previewImg.src = base64Data;
                previewDiv.classList.remove('hidden');
                hiddenInput.value = base64Data;
                
                // Show success message with image dimensions
                console.log(`✅ Image validated: ${width}×${height}px (Aspect ratio: ${aspectRatio.toFixed(3)})`);
            };
            reader.readAsDataURL(file);
        };

        img.onerror = () => {
            toast.error('Failed to load image. Please try another file');
        };

        // Start loading the image
        img.src = URL.createObjectURL(file);
    }

    removeImage(uploadInput, previewDiv, hiddenInput) {
        uploadInput.value = '';
        previewDiv.classList.add('hidden');
        hiddenInput.value = '';
    }

    // Helper method to convert image URL to base64 (for edit modal)
    async loadImageAsBase64(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error loading image:', error);
            return imageUrl; // Fallback to original URL
        }
    }
    setupCategoryCardSelection(cardSelector, hiddenInputId, subcategorySelectId) {
        const cards = document.querySelectorAll(`.${cardSelector}`);
        const hiddenInput = document.getElementById(hiddenInputId);
        const subcategorySelect = document.getElementById(subcategorySelectId);

        if (!cards.length || !hiddenInput || !subcategorySelect) return;

        cards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove selection from all cards
                cards.forEach(c => c.classList.remove('border-emerald-500', 'bg-emerald-50'));
                
                // Add selection to clicked card
                card.classList.add('border-emerald-500', 'bg-emerald-50');
                
                // Get selected category
                const categoryId = card.dataset.categoryId;
                const selectedCategory = mainCategories.find(cat => cat.id === categoryId);
                
                if (selectedCategory) {
                    // Set hidden input
                    hiddenInput.value = categoryId;
                    
                    // Populate subcategories with newest first
                    subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
                    const subcategories = [...selectedCategory.subcategories];
                    subcategories.reverse().forEach(subcategory => {
                        const option = document.createElement('option');
                        option.value = subcategory;
                        option.textContent = subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
                        subcategorySelect.appendChild(option);
                    });
                }
            });
        });
    }

    // Helper method to find main category from subcategory
    findMainCategoryFromSubcategory(subcategory) {
        for (const mainCategory of mainCategories) {
            if (mainCategory.subcategories.includes(subcategory)) {
                return mainCategory;
            }
        }
        return null;
    }

    openCreateCategoryModal(mainCategoryInputId, subcategorySelectId) {
        // Check if main category is selected
        const mainCategoryInput = document.getElementById(mainCategoryInputId);
        if (!mainCategoryInput.value) {
            toast.error('Please select a main category first');
            return;
        }

        // Get the selected main category
        const selectedMainCategory = mainCategories.find(cat => cat.id === mainCategoryInput.value);
        if (!selectedMainCategory) {
            toast.error('Invalid main category selected');
            return;
        }

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50';
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-25"></div>
            <div class="fixed inset-0 flex items-center justify-center p-4">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-gray-900">Create New Category</h3>
                            <button id="close-create-category-modal" class="text-gray-400 hover:text-gray-600">
                                <i data-lucide="x" class="w-6 h-6"></i>
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="mb-4">
                            <p class="text-sm text-gray-600 mb-2">Adding to: <span class="font-medium text-emerald-600">${selectedMainCategory.name}</span></p>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                            <input type="text" id="new-category-name" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Enter category name">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                            <textarea id="new-category-description" rows="2"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Enter category description"></textarea>
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" id="cancel-create-category" class="btn btn-outline">Cancel</button>
                            <button type="button" id="confirm-create-category" class="btn btn-primary">Create Category</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        initIcons();

        // Event listeners
        document.getElementById('close-create-category-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('cancel-create-category').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('confirm-create-category').addEventListener('click', () => {
            this.handleCreateCategory(selectedMainCategory, subcategorySelectId, modal);
        });

        // Close on overlay click
        modal.querySelector('.fixed.inset-0.bg-black').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    handleCreateCategory(mainCategory, subcategorySelectId, modal) {
        const categoryName = document.getElementById('new-category-name').value.trim();
        const categoryDescription = document.getElementById('new-category-description').value.trim();

        if (!categoryName) {
            toast.error('Please enter a category name');
            return;
        }

        // Check if category already exists
        if (mainCategory.subcategories.includes(categoryName.toLowerCase())) {
            toast.error('This category already exists');
            return;
        }

        // Add new category to main category
        const newCategory = categoryName.toLowerCase();
        mainCategory.subcategories.push(newCategory);
        
        // Update the mainCategories array to reflect the change
        const categoryIndex = mainCategories.findIndex(cat => cat.id === mainCategory.id);
        if (categoryIndex !== -1) {
            mainCategories[categoryIndex] = mainCategory;
        }

        // Update the subcategory select
        const subcategorySelect = document.getElementById(subcategorySelectId);
        const newOption = document.createElement('option');
        newOption.value = newCategory;
        newOption.textContent = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        newOption.selected = true;
        subcategorySelect.appendChild(newOption);

        // Show success message
        toast.success(`Category "${categoryName}" created successfully!`);

        // Close modal
        document.body.removeChild(modal);
        
        // Notify data change for main categories
        window.dispatchEvent(new CustomEvent('mainCategoriesChanged'));
        
        // Notify subcategory changes
        window.dispatchEvent(new CustomEvent('subcategoriesChanged'));
        
        // Refresh subcategory dropdowns
        this.refreshSubcategoryDropdowns();
    }
    async makeAllInStock() {
        if (this.products.length === 0) {
            toast.error('No products to update');
            return;
        }

        // Show confirmation dialog
        const outOfStockProducts = this.products.filter(p => p.status === 'out_of_stock' || p.stock_quantity === 0 || p.stock === 0);
        const message = outOfStockProducts.length > 0 
            ? `This will set ${outOfStockProducts.length} out-of-stock products to "In Stock" with stock quantity 1. Continue?`
            : `This will ensure all ${this.products.length} products are set to "In Stock" with stock quantity 1. Continue?`;

        if (!confirm(message)) {
            return;
        }

        const loadingToast = toast.loading('Updating all products to In Stock...');
        
        try {
            let updatedCount = 0;
            
            if (supabase && supabaseReady) {
                // Update each product directly in Supabase
                for (const product of this.products) {
                    const stockQuantity = (product.stock_quantity || product.stock) === 0 ? 1 : (product.stock_quantity || product.stock);
                    
                    const { error } = await supabase
                        .from('products')
                        .update({
                            status: 'in_stock',
                            stock_quantity: stockQuantity,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', product.id);
                    
                    if (error) {
                        console.error(`Error updating product ${product.id}:`, error);
                    } else {
                        updatedCount++;
                    }
                }
            } else {
                // Fallback to API
                const token = this.authManager.getToken();
                for (const product of this.products) {
                    const updatedProduct = {
                        ...product,
                        status: 'in_stock',
                        stock_quantity: product.stock_quantity === 0 ? 1 : product.stock_quantity,
                        stock: product.stock === 0 ? 1 : product.stock,
                        updated_at: new Date().toISOString()
                    };
                    await api.updateProduct(product.id, updatedProduct, token);
                    updatedCount++;
                }
            }
            
            toast.dismiss(loadingToast);
            toast.success(`Updated ${updatedCount} products to In Stock!`);
            
            // Reload data and refresh
            await this.loadData();
            this.render();
            
            // Notify other dashboards to refresh their data
            this.notifyDataChange();
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('Error updating products:', error);
            toast.error('Failed to update products: ' + (error.message || 'Unknown error'));
        }
    }

    notifyDataChange() {
        // Dispatch a custom event to notify other dashboards
        window.dispatchEvent(new CustomEvent('productsChanged'));
    }
    openCreateMainCategoryModal() {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50';
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-25"></div>
            <div class="fixed inset-0 flex items-center justify-center p-4">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-gray-900">Create Main Category</h3>
                            <button id="close-create-main-category-modal" class="text-gray-400 hover:text-gray-600">
                                <i data-lucide="x" class="w-6 h-6"></i>
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                            <input type="text" id="new-main-category-name" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Enter category name">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <input type="text" id="new-main-category-description" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Enter category description">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                            <select id="new-main-category-icon" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                <option value="shopping-cart">Shopping Cart</option>
                                <option value="heart">Heart</option>
                                <option value="star">Star</option>
                                <option value="gift">Gift</option>
                                <option value="home">Home</option>
                                <option value="book">Book</option>
                                <option value="music">Music</option>
                                <option value="camera">Camera</option>
                            </select>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                            <select id="new-main-category-color" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                <option value="from-pink-400 to-rose-600">Pink to Rose</option>
                                <option value="from-blue-400 to-cyan-600">Blue to Cyan</option>
                                <option value="from-yellow-400 to-orange-500">Yellow to Orange</option>
                                <option value="from-teal-400 to-emerald-600">Teal to Emerald</option>
                                <option value="from-indigo-400 to-purple-600">Indigo to Purple</option>
                                <option value="from-red-400 to-pink-600">Red to Pink</option>
                            </select>
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" id="cancel-create-main-category" class="btn btn-outline">Cancel</button>
                            <button type="button" id="confirm-create-main-category" class="btn btn-primary">Create Category</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        initIcons();

        // Event listeners
        document.getElementById('close-create-main-category-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('cancel-create-main-category').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('confirm-create-main-category').addEventListener('click', () => {
            this.handleCreateMainCategory(modal);
        });

        // Close on overlay click
        modal.querySelector('.fixed.inset-0.bg-black').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    handleCreateMainCategory(modal) {
        const name = document.getElementById('new-main-category-name').value.trim();
        const description = document.getElementById('new-main-category-description').value.trim();
        const icon = document.getElementById('new-main-category-icon').value;
        const color = document.getElementById('new-main-category-color').value;

        if (!name) {
            toast.error('Please enter a category name');
            return;
        }

        // Check if category already exists
        if (mainCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            toast.error('This category already exists');
            return;
        }

        // Create new main category
        const newMainCategory = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name: name,
            icon: icon,
            color: color,
            description: description || `${name} products`,
            subcategories: []
        };

        // Add to mainCategories array
        mainCategories.push(newMainCategory);

        // Show success message
        toast.success(`Main category "${name}" created successfully!`);

        // Close modal
        document.body.removeChild(modal);

        // Notify data change
        this.notifyDataChange();
        
        // Notify main category changes
        window.dispatchEvent(new CustomEvent('mainCategoriesChanged'));
        
        // Refresh subcategory dropdowns
        this.refreshSubcategoryDropdowns();

        // Reload admin dashboard
        this.render();
    }

    refreshSubcategoryDropdowns() {
        // Refresh add product form subcategory dropdown
        const addMainCategoryInput = document.getElementById('product-main-category');
        const addSubcategorySelect = document.getElementById('product-category');
        
        if (addMainCategoryInput && addSubcategorySelect && addMainCategoryInput.value) {
            const selectedCategory = mainCategories.find(cat => cat.id === addMainCategoryInput.value);
            if (selectedCategory) {
                addSubcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
                
                // Add subcategories with newest first
                const subcategories = [...selectedCategory.subcategories];
                subcategories.reverse().forEach(subcategory => {
                    const option = document.createElement('option');
                    option.value = subcategory;
                    option.textContent = subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
                    addSubcategorySelect.appendChild(option);
                });
            }
        }

        // Refresh edit product form subcategory dropdown
        const editMainCategoryInput = document.getElementById('edit-product-main-category');
        const editSubcategorySelect = document.getElementById('edit-product-category');
        
        if (editMainCategoryInput && editSubcategorySelect && editMainCategoryInput.value) {
            const selectedCategory = mainCategories.find(cat => cat.id === editMainCategoryInput.value);
            if (selectedCategory) {
                editSubcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
                
                // Add subcategories with newest first
                const subcategories = [...selectedCategory.subcategories];
                subcategories.reverse().forEach(subcategory => {
                    const option = document.createElement('option');
                    option.value = subcategory;
                    option.textContent = subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
                    editSubcategorySelect.appendChild(option);
                });
            }
        }
    }
}
// ===== MAIN APPLICATION =====



class MangoMartApp {
    constructor() {
        this.authManager = new AuthManager();
        this.currentDashboard = null;
    }

    async init() {
        // Initialize Supabase first
        console.log('🚀 Initializing Supabase...');
        await initSupabase();
        
        // Wait for Supabase to be ready
        let attempts = 0;
        while (!supabaseReady && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!supabaseReady) {
            console.warn('⚠️ Supabase not ready after timeout, continuing...');
        } else {
            console.log('✅ Supabase ready, proceeding with app initialization');
        }
        
        // Initialize authentication manager
        console.log('🔐 Initializing Authentication...');
        await this.authManager.init((isAuthenticated, role) => {
            this.handleAuthChange(isAuthenticated, role);
        });
        
        // Listen for product changes from admin dashboard
        window.addEventListener('productsChanged', () => {
            console.log('Products changed event received');
            if (this.currentDashboard && this.currentDashboard.loadData) {
                this.currentDashboard.loadData().then(() => {
                    if (this.currentDashboard.render) {
                        this.currentDashboard.render();
                    }
                });
            }
        });
        
        // Listen for main category changes from admin dashboard
        window.addEventListener('mainCategoriesChanged', () => {
            if (this.currentDashboard && this.currentDashboard.render) {
                this.currentDashboard.render();
            }
        });
        
        // Listen for subcategory changes from admin dashboard
        window.addEventListener('subcategoriesChanged', () => {
            // Force re-render of the current view
            if (this.currentDashboard) {
                if (this.currentDashboard.currentView === 'category' && this.currentDashboard.renderCategoryPage) {
                    this.currentDashboard.renderCategoryPage();
                } else if (this.currentDashboard.render) {
                    this.currentDashboard.render();
                }
            }
        });
    }

    handleAuthChange(isAuthenticated, role) {
        if (!isAuthenticated) {
            try {
                localStorage.removeItem('mango-view-state');
            } catch (error) {
                console.warn('Failed to clear view state:', error);
            }
            this.authManager.renderAuthPage();
            this.currentDashboard = null;
        } else {
            this.loadDashboard(role);
        }
    }

    async loadDashboard(role) {
        console.log('=== LOADING DASHBOARD ===');
        console.log('Role received:', role);
        console.log('Role type:', typeof role);
        console.log('Current dashboard:', this.currentDashboard?.constructor?.name);
        
        // Prevent loading the same dashboard twice
        const expectedDashboard = role === 'admin' ? 'AdminDashboard' : 
                                 role === 'delivery' ? 'DeliveryDashboard' : 'CustomerDashboard';
        
        if (this.currentDashboard?.constructor?.name === expectedDashboard) {
            console.log('Dashboard already loaded, skipping...');
            return;
        }
        
        // Clear current dashboard
        if (this.currentDashboard) {
            console.log('Clearing current dashboard...');
            this.currentDashboard = null;
        }

        switch (role) {
            case 'admin':
                console.log('Loading Admin Dashboard...');
                this.currentDashboard = new AdminDashboard(this.authManager);
                await this.currentDashboard.init();
                break;
            
            case 'delivery':
                console.log('Loading Delivery Dashboard...');
                this.currentDashboard = new DeliveryDashboard(this.authManager);
                await this.currentDashboard.init();
                break;
            
            case 'customer':
            default:
                console.log('Loading Customer Dashboard...');
                this.currentDashboard = new CustomerDashboard(this.authManager);
                await this.currentDashboard.init();
                break;
        }
        
        console.log('Dashboard loaded:', this.currentDashboard?.constructor?.name);
    }

    async createAdminUser() {
        console.log('Creating admin user...');
        try {
            const adminData = {
                name: 'Admin User',
                email: 'varunraj173205@gmail.com',
                mobile: '9876543210',
                password: 'varun@173205',
                role: 'admin'
            };
            
            const result = await db.createUser(adminData);
            console.log('Admin user created:', result);
            return result;
        } catch (error) {
            console.error('Error creating admin user:', error);
            return { error: error.message };
        }
    }

    async createTestOrder() {
        console.log('Creating test order...');
        try {
            const testOrder = {
                id: 'TEST-' + Date.now(),
                customer_id: 'test-customer-id',
                customer_name: 'Test Customer',
                customer_email: 'test@example.com',
                customer_mobile: '9876543210',
                customer_address: '123 Test Street',
                customer_landmark: 'Near Test Mall',
                customer_pincode: '123456',
                items: [
                    { id: '1', name: 'Test Product', price: 100, quantity: 1 }
                ],
                total_amount: 100,
                status: 'confirmed',
                payment_status: 'paid',
                payment_id: 'test_payment_' + Date.now(),
                payment_signature: 'test_signature',
                created_at: new Date().toISOString(),
                paid_at: new Date().toISOString(),
                product_id: '1',
                delivery_status: 'pending'
            };
            
            if (supabase && supabaseReady) {
                const { data, error } = await supabase
                    .from('orders')
                    .insert([testOrder])
                    .select();
                
                if (error) {
                    console.error('Error creating test order:', error);
                    return { error: error.message };
                }
                
                console.log('Test order created:', data);
                return { success: true, order: data[0] };
            } else {
                console.error('Supabase not available');
                return { error: 'Supabase not available' };
            }
        } catch (error) {
            console.error('Error creating test order:', error);
            return { error: error.message };
        }
    }

    async checkOrdersTable() {
        console.log('Checking orders table...');
        try {
            if (supabase && supabaseReady) {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .limit(5);
                
                if (error) {
                    console.error('Error checking orders table:', error);
                    return { error: error.message };
                }
                
                console.log('Orders found:', data);
                return { success: true, orders: data };
            } else {
                console.error('Supabase not available');
                return { error: 'Supabase not available' };
            }
        } catch (error) {
            console.error('Error checking orders table:', error);
            return { error: error.message };
        }
    }

    async testOrderDisplay() {
        console.log('Testing order display...');
        try {
            const result = await this.checkOrdersTable();
            if (result.success) {
                console.log('Orders found:', result.orders.length);
                return result;
            } else {
                console.error('Failed to get orders:', result.error);
                return result;
            }
        } catch (error) {
            console.error('Error testing order display:', error);
            return { error: error.message };
        }
    }

    async testDirectOrderInsert() {
        console.log('Testing direct order insert...');
        try {
            const testOrder = {
                id: 'DIRECT-TEST-' + Date.now(),
                customer_id: 'test-customer-id',
                customer_name: 'Direct Test Customer',
                customer_email: 'direct@example.com',
                customer_mobile: '9876543210',
                customer_address: '456 Direct Test Street',
                customer_landmark: 'Near Direct Test Mall',
                customer_pincode: '654321',
                items: [
                    { id: '2', name: 'Direct Test Product', price: 200, quantity: 2 }
                ],
                total_amount: 400,
                status: 'confirmed',
                payment_status: 'paid',
                payment_id: 'direct_test_payment_' + Date.now(),
                payment_signature: 'direct_test_signature',
                created_at: new Date().toISOString(),
                paid_at: new Date().toISOString(),
                product_id: '2',
                delivery_status: 'pending'
            };
            
            if (supabase && supabaseReady) {
                const { data, error } = await supabase
                    .from('orders')
                    .insert([testOrder])
                    .select();
                
                if (error) {
                    console.error('Error inserting direct test order:', error);
                    return { error: error.message };
                }
                
                console.log('Direct test order inserted:', data);
                return { success: true, order: data[0] };
            } else {
                console.error('Supabase not available');
                return { error: 'Supabase not available' };
            }
        } catch (error) {
            console.error('Error inserting direct test order:', error);
            return { error: error.message };
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
        window.app = new MangoMartApp();
            enableLazyImages();
            window.app.init().catch(err => {
                console.error('App init failed:', err);
                if (window.app && window.app.authManager) {
                    window.app.authManager.renderAuthPage();
                }
            });
        } catch (err) {
            console.error('App init threw:', err);
            const app = document.getElementById('app');
            if (app) app.innerHTML = '<div class="p-6 text-center">Failed to initialize. Please refresh.</div>';
        }
    });
} else {
    try {
    window.app = new MangoMartApp();
        enableLazyImages();
        window.app.init().catch(err => {
            console.error('App init failed:', err);
            if (window.app && window.app.authManager) {
                window.app.authManager.renderAuthPage();
            }
        });
    } catch (err) {
        console.error('App init threw:', err);
        const app = document.getElementById('app');
        if (app) app.innerHTML = '<div class="p-6 text-center">Failed to initialize. Please refresh.</div>';
    }
}
