"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var UserProfile;
(function (UserProfile) {
    /**
     * Get or create user profile
     */
    function getUserProfile() {
        var cached = Config.getProperty(Constants.PROPERTIES.USER_PROFILE);
        if (cached) {
            try {
                return JSON.parse(cached);
            }
            catch (_e) {
                AppLogger.warn('Failed to parse cached profile', _e);
            }
        }
        // Create initial profile
        var userEmail = Session.getActiveUser().getEmail();
        var userName = getUserName();
        return createInitialProfile(userEmail, userName);
    }
    UserProfile.getUserProfile = getUserProfile;
    /**
     * Create initial profile for new user
     */
    function createInitialProfile(email, name) {
        return {
            email: email,
            name: name,
            identity: {
                role: 'Professional',
                expertise: [],
                communicationStyle: 'Clear and professional'
            },
            personality: {
                formality: Constants.STYLE.FORMALITY_NEUTRAL,
                directness: 3,
                warmth: 3,
                detailLevel: 3
            },
            patterns: {
                greetings: {
                    formal: Constants.STYLE.DEFAULT_GREETINGS,
                    casual: Constants.STYLE.DEFAULT_GREETINGS,
                    client: ['Dear', 'Hello']
                },
                closings: {
                    formal: ['Best regards', 'Sincerely'],
                    casual: Constants.STYLE.DEFAULT_CLOSINGS,
                    client: ['Best regards', 'Kind regards']
                }
            },
            vocabulary: {
                common: [],
                avoided: [],
                professional: []
            },
            rules: [
                'Maintain professional tone',
                'Be clear and concise',
                'Respond promptly and helpfully'
            ],
            lastUpdated: new Date().toISOString()
        };
    }
    /**
     * Update user profile with new insights
     */
    function updateProfile(updates) {
        var current = getUserProfile();
        var updated = __assign(__assign(__assign({}, current), updates), { lastUpdated: new Date().toISOString() });
        Config.setProperty(Constants.PROPERTIES.USER_PROFILE, JSON.stringify(updated));
        AppLogger.info('User profile updated');
    }
    UserProfile.updateProfile = updateProfile;
    /**
     * Learn from analyzed emails (called by AI module to avoid circular dep)
     */
    function updateFromAnalysis(analysisResult) {
        try {
            var current = getUserProfile();
            // Merge learned patterns with current profile
            var merged = __assign(__assign({}, current), { identity: analysisResult.identity || current.identity, personality: analysisResult.personality || current.personality, patterns: mergePatterns(current.patterns, analysisResult.patterns), vocabulary: mergeVocabulary(current.vocabulary, analysisResult.vocabulary), rules: __spreadArray([], __read(new Set(__spreadArray(__spreadArray([], __read(current.rules), false), __read((analysisResult.rules || [])), false))), false), lastUpdated: new Date().toISOString() });
            updateProfile(merged);
            return merged;
        }
        catch (_e) {
            AppLogger.error('Failed to update from analysis', _e);
            return getUserProfile();
        }
    }
    UserProfile.updateFromAnalysis = updateFromAnalysis;
    /**
     * Improve profile from a specific thread (returns prompt for AI module)
     */
    function getImprovementPrompt(thread) {
        var current = getUserProfile();
        var threadContent = extractThreadContent(thread);
        return Prompts.getStyleImprovementPrompt(current, threadContent);
    }
    UserProfile.getImprovementPrompt = getImprovementPrompt;
    /**
     * Apply improvements from AI analysis
     */
    function applyImprovements(improvedData) {
        try {
            updateProfile(improvedData);
            return improvedData;
        }
        catch (_e) {
            AppLogger.error('Failed to apply improvements', _e);
            return getUserProfile();
        }
    }
    UserProfile.applyImprovements = applyImprovements;
    /**
     * Extract thread content for analysis
     */
    function extractThreadContent(thread) {
        var messages = thread.getMessages();
        var userEmail = Session.getActiveUser().getEmail();
        return messages.map(function (msg) {
            var isFromMe = msg.getFrom().toLowerCase().includes(userEmail.toLowerCase());
            return "From: ".concat(msg.getFrom(), " ").concat(isFromMe ? '(ME)' : '', "\nDate: ").concat(msg.getDate(), "\n").concat(Utils.cleanEmailBody(msg.getPlainBody()));
        }).join('\n\n---\n\n');
    }
    /**
     * Helper to merge pattern objects
     */
    function mergePatterns(current, learned) {
        var _a, _b, _c, _d, _f, _g;
        if (!learned) {
            return current;
        }
        return {
            greetings: {
                formal: mergeArrays(current.greetings.formal, (_a = learned.greetings) === null || _a === void 0 ? void 0 : _a.formal),
                casual: mergeArrays(current.greetings.casual, (_b = learned.greetings) === null || _b === void 0 ? void 0 : _b.casual),
                client: mergeArrays(current.greetings.client, (_c = learned.greetings) === null || _c === void 0 ? void 0 : _c.client)
            },
            closings: {
                formal: mergeArrays(current.closings.formal, (_d = learned.closings) === null || _d === void 0 ? void 0 : _d.formal),
                casual: mergeArrays(current.closings.casual, (_f = learned.closings) === null || _f === void 0 ? void 0 : _f.casual),
                client: mergeArrays(current.closings.client, (_g = learned.closings) === null || _g === void 0 ? void 0 : _g.client)
            }
        };
    }
    /**
     * Helper to merge vocabulary objects
     */
    function mergeVocabulary(current, learned) {
        if (!learned) {
            return current;
        }
        return {
            common: mergeArrays(current.common, learned.common),
            avoided: mergeArrays(current.avoided, learned.avoided),
            professional: mergeArrays(current.professional, learned.professional)
        };
    }
    /**
     * Merge arrays keeping unique values
     */
    function mergeArrays(current, learned) {
        if (!learned) {
            return current;
        }
        return __spreadArray([], __read(new Set(__spreadArray(__spreadArray([], __read(learned), false), __read(current), false))), false).slice(0, 10);
    }
    /**
     * Get user's name from contacts or email
     */
    function getUserName() {
        try {
            // Try to get from contacts
            var userEmail = Session.getActiveUser().getEmail();
            // For now, extract from email
            var namePart = userEmail.split('@')[0];
            if (!namePart) {
                return undefined;
            }
            return namePart.split('.').map(function (part) {
                return part.charAt(0).toUpperCase() + part.slice(1);
            }).join(' ');
        }
        catch (_a) {
            // Error parsing email - return undefined
            return undefined;
        }
    }
})(UserProfile || (UserProfile = {}));
//# sourceMappingURL=user-profile.js.map