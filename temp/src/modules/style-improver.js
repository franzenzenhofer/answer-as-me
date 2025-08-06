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
var StyleImprover;
(function (StyleImprover) {
    /**
     * Improve existing writing style based on a single email thread
     * This allows incremental learning from specific conversations
     */
    function improveStyleFromThread(currentStyle, thread) {
        try {
            // Extract all messages from thread
            var messages = thread.getMessages();
            var myEmail_1 = Session.getActiveUser().getEmail();
            // Find messages sent by me
            var myMessages = messages.filter(function (msg) {
                var from = msg.getFrom().toLowerCase();
                return from.includes(myEmail_1.toLowerCase());
            });
            if (myMessages.length === 0) {
                AppLogger.warn('No messages from user in thread');
                return null;
            }
            // Analyze patterns from my messages in this thread
            var threadPatterns = analyzeThreadPatterns(myMessages);
            // Merge with existing style
            return mergeStyles(currentStyle, threadPatterns);
        }
        catch (error) {
            AppLogger.error('Failed to improve style from thread', error);
            return null;
        }
    }
    StyleImprover.improveStyleFromThread = improveStyleFromThread;
    /**
     * Analyze patterns from messages in a thread
     */
    function analyzeThreadPatterns(messages) {
        var greetings = [];
        var closings = [];
        var sentences = [];
        messages.forEach(function (msg) {
            var body = Utils.cleanEmailBody(msg.getPlainBody());
            // Extract greeting
            var greetingMatch = body.match(Constants.PATTERNS.GREETING);
            if (greetingMatch) {
                greetings.push(greetingMatch[0]);
            }
            // Extract closing
            var lines = body.split('\n');
            for (var i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
                var line = lines[i].trim();
                if (line.match(Constants.PATTERNS.CLOSING)) {
                    closings.push(line);
                    break;
                }
            }
            // Extract sentences
            var sentenceMatches = body.match(/[^.!?]+[.!?]+/g);
            if (sentenceMatches) {
                sentences.push.apply(sentences, __spreadArray([], __read(sentenceMatches), false));
            }
        });
        return {
            greetings: getUniqueItems(greetings),
            closings: getUniqueItems(closings),
            sentencePatterns: extractPatterns(sentences),
            formalityLevel: detectFormality(sentences),
            punctuationStyle: detectPunctuationStyle(sentences)
        };
    }
    /**
     * Merge current style with new patterns from thread
     */
    function mergeStyles(current, threadPatterns) {
        return {
            // Merge greetings, keeping most recent/relevant
            greetings: mergeAndPrioritize(current.greetings, threadPatterns.greetings || [], Constants.STYLE.MAX_GREETINGS),
            // Merge closings
            closings: mergeAndPrioritize(current.closings, threadPatterns.closings || [], Constants.STYLE.MAX_CLOSINGS),
            // Merge sentence patterns
            sentencePatterns: mergeAndPrioritize(current.sentencePatterns, threadPatterns.sentencePatterns || [], Constants.STYLE.MAX_PATTERNS),
            // Keep existing vocabulary (could be enhanced)
            vocabulary: current.vocabulary,
            // Average formality levels
            formalityLevel: threadPatterns.formalityLevel !== undefined
                ? Math.round((current.formalityLevel + threadPatterns.formalityLevel) / 2)
                : current.formalityLevel,
            // Keep current average sentence length
            averageSentenceLength: current.averageSentenceLength,
            // Keep current email length preference
            emailLength: current.emailLength,
            // Update punctuation style if different
            punctuationStyle: threadPatterns.punctuationStyle || current.punctuationStyle
        };
    }
    /**
     * Merge arrays and prioritize newer items
     */
    function mergeAndPrioritize(current, new_, maxItems) {
        // Combine and deduplicate
        var combined = __spreadArray([], __read(new Set(__spreadArray(__spreadArray([], __read(new_), false), __read(current), false))), false);
        // Return up to maxItems, prioritizing newer patterns
        return combined.slice(0, maxItems);
    }
    /**
     * Get unique items from array
     */
    function getUniqueItems(items) {
        return __spreadArray([], __read(new Set(items)), false);
    }
    /**
     * Extract sentence patterns (reuse from StyleAnalyzer)
     */
    function extractPatterns(sentences) {
        var starters = sentences
            .map(function (s) { return s.trim().split(' ').slice(0, 3).join(' '); })
            .filter(function (s) { return s.length > Constants.STYLE.MIN_WORD_LENGTH; });
        // Count frequency and return most common
        var frequency = {};
        starters.forEach(function (pattern) {
            frequency[pattern] = (frequency[pattern] || 0) + 1;
        });
        return Object.entries(frequency)
            .filter(function (_a) {
            var _b = __read(_a, 2), _ = _b[0], count = _b[1];
            return count >= Constants.STYLE.MIN_PATTERN_FREQUENCY;
        })
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, Constants.STYLE.MAX_PATTERNS)
            .map(function (entry) { return entry[0]; });
    }
    /**
     * Detect formality level from sentences
     */
    function detectFormality(sentences) {
        var text = sentences.join(' ').toLowerCase();
        // Count formal indicators
        var formalCount = Constants.LISTS.FORMAL_INDICATORS
            .filter(function (indicator) { return text.includes(indicator); })
            .length;
        // Count casual indicators
        var casualCount = Constants.LISTS.CASUAL_INDICATORS
            .filter(function (indicator) { return text.includes(indicator); })
            .length;
        // Calculate formality score
        if (casualCount > formalCount * 2) {
            return Constants.STYLE.FORMALITY_CASUAL;
        }
        if (formalCount > casualCount * 2) {
            return Constants.STYLE.FORMALITY_FORMAL;
        }
        return Constants.STYLE.FORMALITY_NEUTRAL;
    }
    /**
     * Detect punctuation style
     */
    function detectPunctuationStyle(sentences) {
        var text = sentences.join(' ');
        var exclamationRatio = (text.match(/!/g) || []).length / sentences.length;
        var ellipsisCount = (text.match(/\.\.\./g) || []).length;
        var dashCount = (text.match(/--|-/g) || []).length;
        if (exclamationRatio > 0.1) {
            return 'enthusiastic';
        }
        if (ellipsisCount > 0) {
            return 'casual';
        }
        if (dashCount > sentences.length * 0.1) {
            return 'detailed';
        }
        return Constants.STYLE.DEFAULT_PUNCTUATION;
    }
})(StyleImprover || (StyleImprover = {}));
//# sourceMappingURL=style-improver.js.map