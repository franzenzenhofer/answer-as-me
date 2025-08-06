"use strict";
var Utils;
(function (Utils) {
    /**
     * Validate email address format
     */
    function isValidEmail(email) {
        return Constants.PATTERNS.EMAIL_ADDRESS.test(email);
    }
    Utils.isValidEmail = isValidEmail;
    /**
     * Truncate text to specified length
     */
    function truncate(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return "".concat(text.substring(0, maxLength - Constants.STYLE.MIN_SENTENCE_LENGTH), "...");
    }
    Utils.truncate = truncate;
    /**
     * Extract email domain
     */
    function getEmailDomain(email) {
        var parts = email.split('@');
        return parts.length === 2 ? parts[1] : '';
    }
    Utils.getEmailDomain = getEmailDomain;
    /**
     * Format date for display
     */
    function formatDate(date) {
        return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm');
    }
    Utils.formatDate = formatDate;
    /**
     * Parse JSON safely
     */
    function parseJsonSafe(json, defaultValue) {
        try {
            return JSON.parse(json);
        }
        catch (_e) {
            AppLogger.warn('Failed to parse JSON', _e);
            return defaultValue;
        }
    }
    Utils.parseJsonSafe = parseJsonSafe;
    /**
     * Clean email body text
     */
    function cleanEmailBody(body) {
        if (!body || typeof body !== 'string') {
            return '';
        }
        // First sanitize for security
        var cleaned = sanitizeEmailContent(body);
        // Remove excessive whitespace
        cleaned = cleaned.replace(Constants.PATTERNS.MULTIPLE_SPACES, ' ').trim();
        // Remove email signatures (simple heuristic)
        var signaturePatterns = [
            /--\s*\n[\s\S]*/, // Replaced .* with [\s\S]* to match across lines
            /Sent from my.*/i,
            /Get Outlook for.*/i,
            /^Best.*?\n.*$/gm
        ];
        signaturePatterns.forEach(function (pattern) {
            cleaned = cleaned.replace(pattern, '').trim();
        });
        return cleaned;
    }
    Utils.cleanEmailBody = cleanEmailBody;
    /**
     * Extract sender name from email
     */
    function extractSenderName(fromHeader) {
        // Format: "Name <email@example.com>" or just "email@example.com"
        var match = fromHeader.match(/^"?([^"<]+)"?\s*<?/);
        if (match && match[1]) {
            return match[1].trim();
        }
        // If no name, use part before @ from email
        var emailMatch = fromHeader.match(/([^@]+)@/);
        return emailMatch ? emailMatch[1] : 'Unknown';
    }
    Utils.extractSenderName = extractSenderName;
    /**
     * Generate a unique ID
     */
    function generateId() {
        return Utilities.getUuid();
    }
    Utils.generateId = generateId;
    /**
     * Sleep for specified milliseconds
     */
    function sleep(ms) {
        Utilities.sleep(ms);
    }
    Utils.sleep = sleep;
    /**
     * Chunk array into smaller arrays
     */
    function chunk(array, size) {
        var chunks = [];
        for (var i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    Utils.chunk = chunk;
    /**
     * Retry a function with exponential backoff (synchronous for Google Apps Script)
     */
    function retryWithBackoff(fn, maxRetries, initialDelay) {
        if (maxRetries === void 0) { maxRetries = 3; }
        if (initialDelay === void 0) { initialDelay = 1000; }
        var lastError;
        for (var i = 0; i < maxRetries; i++) {
            try {
                return fn();
            }
            catch (error) {
                lastError = error;
                var errorMessage = lastError.message.toLowerCase();
                // Check if error is retryable
                var isRetryable = errorMessage.includes('timeout') ||
                    errorMessage.includes('timed out') ||
                    errorMessage.includes('network') ||
                    errorMessage.includes('temporarily') ||
                    errorMessage.includes('500') ||
                    errorMessage.includes('502') ||
                    errorMessage.includes('503') ||
                    errorMessage.includes('504');
                if (!isRetryable) {
                    throw error; // Don't retry non-network errors
                }
                if (i < maxRetries - 1) {
                    var delay = Math.min(initialDelay * Math.pow(2, i), 10000); // Max 10 seconds
                    AppLogger.info("Retry ".concat(i + 1, "/").concat(maxRetries, " after ").concat(delay, "ms"), {
                        error: errorMessage
                    });
                    sleep(delay);
                }
            }
        }
        throw lastError || new Error('Max retries exceeded');
    }
    Utils.retryWithBackoff = retryWithBackoff;
    /**
     * Escape HTML entities for XSS protection
     */
    function escapeHtml(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        var htmlEntities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '=': '&#x3D;',
            '`': '&#x60;'
        };
        return text.replace(/[&<>"'\/=`]/g, function (char) { return htmlEntities[char] || char; });
    }
    Utils.escapeHtml = escapeHtml;
    /**
     * Sanitize email content for safe display
     * Removes potentially dangerous content while preserving text
     */
    function sanitizeEmailContent(content) {
        if (!content || typeof content !== 'string') {
            return '';
        }
        // Remove any script tags and their content
        var sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        // Remove any style tags to prevent CSS injection
        sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        // Remove event handlers
        sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
        // Remove javascript: protocol
        sanitized = sanitized.replace(/javascript:/gi, '');
        // Remove data: URLs that could contain scripts
        sanitized = sanitized.replace(/data:text\/html[^,]*,/gi, '');
        return sanitized;
    }
    Utils.sanitizeEmailContent = sanitizeEmailContent;
    /**
     * Get relative time string
     */
    function getRelativeTime(date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var minutes = Math.floor(diff / 60000);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);
        if (days > 0) {
            return "".concat(days, " day").concat(days > 1 ? 's' : '', " ago");
        }
        if (hours > 0) {
            return "".concat(hours, " hour").concat(hours > 1 ? 's' : '', " ago");
        }
        if (minutes > 0) {
            return "".concat(minutes, " minute").concat(minutes > 1 ? 's' : '', " ago");
        }
        return 'just now';
    }
    Utils.getRelativeTime = getRelativeTime;
    /**
     * Extract domain from email address
     */
    function extractDomain(email) {
        var parts = email.split('@');
        return parts.length > 1 && parts[1] ? parts[1].toLowerCase() : '';
    }
    Utils.extractDomain = extractDomain;
    /**
     * Execute URL fetch with timeout monitoring
     */
    function fetchWithTimeout(url, options) {
        var startTime = new Date().getTime();
        try {
            // Note: Google Apps Script doesn't support true timeouts
            // We can only monitor how long the request takes
            var response = UrlFetchApp.fetch(url, options);
            var elapsedTime = new Date().getTime() - startTime;
            if (elapsedTime > Constants.API.TIMEOUT_MS) {
                AppLogger.warn('Request exceeded expected timeout', {
                    url: url,
                    elapsedMs: elapsedTime,
                    expectedTimeoutMs: Constants.API.TIMEOUT_MS
                });
            }
            return response;
        }
        catch (error) {
            var elapsedTime = new Date().getTime() - startTime;
            AppLogger.error('Network request failed', {
                url: url,
                elapsedMs: elapsedTime,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    Utils.fetchWithTimeout = fetchWithTimeout;
})(Utils || (Utils = {}));
//# sourceMappingURL=utils.js.map