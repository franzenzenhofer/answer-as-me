"use strict";
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
var StyleAnalyzer;
(function (StyleAnalyzer) {
    /**
     * Analyze writing style from sent emails
     */
    function analyzeEmails(sentEmails) {
        // Null safety check
        if (!sentEmails || !Array.isArray(sentEmails) || sentEmails.length === 0) {
            return getDefaultWritingStyle();
        }
        var greetings = [];
        var closings = [];
        var sentences = [];
        // Process up to 200 emails
        var emailsToProcess = sentEmails.slice(0, 200);
        emailsToProcess.forEach(function (email) {
            if (!email) {
                return;
            }
            try {
                var plainBody = email.getPlainBody();
                if (!plainBody) {
                    return;
                }
                var body = Utils.cleanEmailBody(plainBody);
                // Skip very short emails
                if (!body || body.length < 50) {
                    return;
                }
                // Extract greeting
                var greetingMatch = body.match(/^(Hi|Hello|Hey|Dear|Good\s+\w+)[,\s]*/i);
                if (greetingMatch && greetingMatch[1]) {
                    greetings.push(greetingMatch[1]);
                }
                // Extract closing
                var lines = body.split('\n');
                if (lines && lines.length > 0) {
                    for (var i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
                        var line = lines[i];
                        if (line) {
                            var trimmedLine = line.trim();
                            if (trimmedLine && trimmedLine.match(/(regards|best|sincerely|thanks|cheers)/i)) {
                                closings.push(trimmedLine);
                                break;
                            }
                        }
                    }
                }
                // Extract sentences for pattern analysis
                var sentenceMatches = body.match(/[^.!?]+[.!?]+/g);
                if (sentenceMatches && sentenceMatches.length > 0) {
                    sentences.push.apply(sentences, __spreadArray([], __read(sentenceMatches.slice(0, 5)), false)); // First 5 sentences
                }
            }
            catch (error) {
                AppLogger.warn('Failed to analyze email', error);
            }
        });
        // Build style profile
        return {
            greetings: getTopItems(greetings, 3),
            closings: getTopItems(closings, 3),
            sentencePatterns: extractPatterns(sentences),
            vocabulary: [], // Could be enhanced with word frequency analysis
            formalityLevel: detectFormality(sentences),
            averageSentenceLength: sentences.length > 0
                ? Math.round(sentences.join(' ').length / sentences.length)
                : 15,
            emailLength: 'medium', // Default to medium
            punctuationStyle: detectPunctuationStyle(sentences)
        };
    }
    StyleAnalyzer.analyzeEmails = analyzeEmails;
    /**
     * Get most common items
     */
    function getTopItems(items, count) {
        var frequency = {};
        items.forEach(function (item) {
            frequency[item] = (frequency[item] || 0) + 1;
        });
        return Object.entries(frequency)
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, count)
            .map(function (entry) { return entry[0]; });
    }
    /**
     * Extract sentence patterns
     */
    function extractPatterns(sentences) {
        if (!sentences || sentences.length === 0) {
            return [];
        }
        var patterns = [];
        // Look for common starters
        var starters = sentences
            .filter(function (s) { return s && typeof s === 'string'; })
            .map(function (s) {
            var words = s.trim().split(' ');
            return words ? words.slice(0, 3).join(' ') : '';
        })
            .filter(function (s) { return s && s.length > 5; });
        if (starters.length > 0) {
            patterns.push.apply(patterns, __spreadArray([], __read(getTopItems(starters, 5)), false));
        }
        return patterns;
    }
    /**
     * Detect formality level
     */
    function detectFormality(sentences) {
        if (!sentences || sentences.length === 0) {
            return 3; // Default to neutral
        }
        var text = sentences
            .filter(function (s) { return s && typeof s === 'string'; })
            .join(' ')
            .toLowerCase();
        // Informal indicators
        var informalCount = ((text.match(/\b(hey|hi|yeah|yep|nope|gonna|wanna|kinda)\b/g) || []).length +
            (text.match(/!+/g) || []).length +
            (text.match(/\.\.\./g) || []).length);
        // Formal indicators
        var formalCount = ((text.match(/\b(regards|sincerely|furthermore|therefore|however|nevertheless)\b/g) || []).length +
            (text.match(/\b(would|could|should|shall|may)\b/g) || []).length);
        // Calculate formality score (1-5)
        if (informalCount > formalCount * 2) {
            return 2;
        }
        if (formalCount > informalCount * 2) {
            return 4;
        }
        return 3;
    }
    /**
     * Detect punctuation style
     */
    function detectPunctuationStyle(sentences) {
        if (!sentences || sentences.length === 0) {
            return 'standard';
        }
        var text = sentences
            .filter(function (s) { return s && typeof s === 'string'; })
            .join(' ');
        var hasExclamations = (text.match(/!/g) || []).length > sentences.length * 0.1;
        var hasEllipsis = (text.match(/\.\.\./g) || []).length > 0;
        var hasDashes = (text.match(/--|-/g) || []).length > sentences.length * 0.1;
        if (hasExclamations) {
            return 'enthusiastic';
        }
        if (hasEllipsis) {
            return 'casual';
        }
        if (hasDashes) {
            return 'detailed';
        }
        return 'standard';
    }
    /**
     * Get default writing style when analysis fails
     */
    function getDefaultWritingStyle() {
        return {
            greetings: Constants.STYLE.DEFAULT_GREETINGS,
            closings: Constants.STYLE.DEFAULT_CLOSINGS,
            sentencePatterns: [],
            vocabulary: [],
            formalityLevel: Constants.STYLE.FORMALITY_NEUTRAL,
            averageSentenceLength: Constants.STYLE.DEFAULT_AVG_SENTENCE_LENGTH,
            emailLength: 'medium',
            punctuationStyle: Constants.STYLE.DEFAULT_PUNCTUATION
        };
    }
})(StyleAnalyzer || (StyleAnalyzer = {}));
//# sourceMappingURL=style-analyzer.js.map