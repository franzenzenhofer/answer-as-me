import '../src/modules/utils';
import '../src/modules/types';
import '../src/modules/style-analyzer';

describe('StyleAnalyzer Module', () => {
  describe('analyzeGreetings', () => {
    it('should extract common greetings', () => {
      const emails = [
        'Hi John,\\n\\nHow are you?',
        'Hello Sarah,\\n\\nThanks for reaching out.',
        'Hi team,\\n\\nQuick update.',
        'Hey Mike,\\n\\nJust checking in.',
        'Hello everyone,\\n\\nHope you are well.'
      ];

      const greetings = StyleAnalyzer.analyzeGreetings(emails);

      expect(greetings).toContain('Hi');
      expect(greetings).toContain('Hello');
      expect(greetings).toContain('Hey');
      expect(greetings.length).toBeLessThanOrEqual(5);
    });

    it('should handle emails without greetings', () => {
      const emails = [
        'Thanks for your message.',
        'I agree with your proposal.',
        'Please see attached.'
      ];

      const greetings = StyleAnalyzer.analyzeGreetings(emails);

      expect(greetings).toEqual(['Hi']); // Default
    });

    it('should ignore case variations', () => {
      const emails = [
        'HI John,\\n\\nTest',
        'hi Sarah,\\n\\nTest',
        'Hi Mike,\\n\\nTest'
      ];

      const greetings = StyleAnalyzer.analyzeGreetings(emails);

      expect(greetings).toContain('Hi');
      expect(greetings.length).toBe(1); // Should consolidate variations
    });

    it('should handle empty input', () => {
      const greetings = StyleAnalyzer.analyzeGreetings([]);
      expect(greetings).toEqual(['Hi']);
    });
  });

  describe('analyzeClosings', () => {
    it('should extract common closings', () => {
      const emails = [
        'Talk soon.\\n\\nBest regards,\\nFranz',
        'Let me know.\\n\\nThanks,\\nFranz',
        'Looking forward.\\n\\nCheers,\\nFranz',
        'See you then.\\n\\nBest,\\nFranz'
      ];

      const closings = StyleAnalyzer.analyzeClosings(emails);

      expect(closings).toContain('Best regards');
      expect(closings).toContain('Thanks');
      expect(closings).toContain('Cheers');
      expect(closings).toContain('Best');
    });

    it('should handle emails without closings', () => {
      const emails = [
        'Please confirm receipt.',
        'See attached document.',
        'FYI'
      ];

      const closings = StyleAnalyzer.analyzeClosings(emails);

      expect(closings).toEqual(['Best regards']); // Default
    });

    it('should extract multi-word closings', () => {
      const emails = [
        'Talk soon.\\n\\nKind regards,\\nFranz',
        'Thanks.\\n\\nWarm regards,\\nFranz',
        'Bye.\\n\\nAll the best,\\nFranz'
      ];

      const closings = StyleAnalyzer.analyzeClosings(emails);

      expect(closings).toContain('Kind regards');
      expect(closings).toContain('Warm regards');
      expect(closings).toContain('All the best');
    });
  });

  describe('analyzeSentencePatterns', () => {
    it('should identify common sentence starters', () => {
      const emails = [
        'Thanks for reaching out about this.',
        'Thanks for your email regarding the project.',
        'I appreciate your message.',
        'I appreciate the update.',
        'Looking forward to hearing from you.'
      ];

      const patterns = StyleAnalyzer.analyzeSentencePatterns(emails);

      expect(patterns).toContain('Thanks for');
      expect(patterns).toContain('I appreciate');
      expect(patterns).toContain('Looking forward');
    });

    it('should filter out rare patterns', () => {
      const emails = [
        'Thanks for the update.',
        'Thanks for reaching out.',
        'This only appears once.',
        'Thanks for your help.'
      ];

      const patterns = StyleAnalyzer.analyzeSentencePatterns(emails);

      expect(patterns).toContain('Thanks for');
      expect(patterns).not.toContain('This only');
    });

    it('should handle empty emails', () => {
      const patterns = StyleAnalyzer.analyzeSentencePatterns([]);
      expect(patterns).toEqual([]);
    });

    it('should extract question patterns', () => {
      const emails = [
        'Could you please send the files?',
        'Could you please review this?',
        'Would you mind checking the document?',
        'Would you mind following up?'
      ];

      const patterns = StyleAnalyzer.analyzeSentencePatterns(emails);

      expect(patterns).toContain('Could you please');
      expect(patterns).toContain('Would you mind');
    });
  });

  describe('calculateAverageSentenceLength', () => {
    it('should calculate correct average', () => {
      const emails = [
        'This is short. This is also short.',
        'This is a longer sentence with more words in it.',
        'Medium length here.'
      ];

      const avg = StyleAnalyzer.calculateAverageSentenceLength(emails);

      expect(avg).toBeGreaterThan(3);
      expect(avg).toBeLessThan(10);
    });

    it('should handle single sentence emails', () => {
      const emails = [
        'Just one sentence here',
        'Another single sentence'
      ];

      const avg = StyleAnalyzer.calculateAverageSentenceLength(emails);

      expect(avg).toBe(3.5); // (4 + 3) / 2
    });

    it('should handle empty emails', () => {
      const avg = StyleAnalyzer.calculateAverageSentenceLength([]);
      expect(avg).toBe(15); // Default
    });

    it('should ignore very short sentences', () => {
      const emails = [
        'OK. This is a normal sentence with several words.',
        'Yes. Here is another regular sentence.',
      ];

      const avg = StyleAnalyzer.calculateAverageSentenceLength(emails);

      expect(avg).toBeGreaterThan(5); // Should ignore "OK" and "Yes"
    });
  });

  describe('detectFormalityLevel', () => {
    it('should detect very formal language', () => {
      const emails = [
        'Dear Mr. Johnson,\\n\\nI would like to formally request...',
        'Dear Dr. Smith,\\n\\nPlease find attached the requested documents.',
        'To whom it may concern,\\n\\nI am writing to inquire...'
      ];

      const level = StyleAnalyzer.detectFormalityLevel(emails);
      expect(level).toBeGreaterThanOrEqual(4);
    });

    it('should detect casual language', () => {
      const emails = [
        'Hey! Just wanted to check in real quick.',
        'Yo, what\\'s up? Got your message.',
        'Hey there! Hope you\\'re doing great!'
      ];

      const level = StyleAnalyzer.detectFormalityLevel(emails);
      expect(level).toBeLessThanOrEqual(2);
    });

    it('should detect neutral formality', () => {
      const emails = [
        'Hi John,\\n\\nThanks for your email.',
        'Hello Sarah,\\n\\nI\\'ve reviewed the document.',
        'Hi team,\\n\\nHere\\'s the weekly update.'
      ];

      const level = StyleAnalyzer.detectFormalityLevel(emails);
      expect(level).toBe(3);
    });

    it('should handle empty emails', () => {
      const level = StyleAnalyzer.detectFormalityLevel([]);
      expect(level).toBe(3); // Default neutral
    });
  });

  describe('extractVocabulary', () => {
    it('should extract frequently used words', () => {
      const emails = [
        'I appreciate your feedback on the project.',
        'Thanks for the feedback. I appreciate it.',
        'The project is moving forward nicely.',
        'Looking forward to your feedback on this.'
      ];

      const vocab = StyleAnalyzer.extractVocabulary(emails);

      expect(vocab).toContain('appreciate');
      expect(vocab).toContain('feedback');
      expect(vocab).toContain('project');
      expect(vocab).toContain('forward');
    });

    it('should filter out common words', () => {
      const emails = [
        'The quick brown fox jumps over the lazy dog.',
        'A quick response would be appreciated.',
        'Thanks for the quick turnaround.'
      ];

      const vocab = StyleAnalyzer.extractVocabulary(emails);

      expect(vocab).toContain('quick');
      expect(vocab).not.toContain('the');
      expect(vocab).not.toContain('for');
      expect(vocab).not.toContain('a');
    });

    it('should handle empty input', () => {
      const vocab = StyleAnalyzer.extractVocabulary([]);
      expect(vocab).toEqual([]);
    });

    it('should limit vocabulary size', () => {
      const emails = Array(100).fill('unique').map((_, i) => 
        `Word${i} appears multiple times. Word${i} is frequent.`
      );

      const vocab = StyleAnalyzer.extractVocabulary(emails);
      expect(vocab.length).toBeLessThanOrEqual(50);
    });
  });

  describe('detectPunctuationStyle', () => {
    it('should detect standard punctuation', () => {
      const emails = [
        'This is a normal sentence.',
        'How are you today?',
        'Thanks for your help!'
      ];

      const style = StyleAnalyzer.detectPunctuationStyle(emails);
      expect(style).toBe('standard');
    });

    it('should detect minimal punctuation', () => {
      const emails = [
        'Thanks for reaching out',
        'Let me know if you need anything',
        'Looking forward to hearing from you'
      ];

      const style = StyleAnalyzer.detectPunctuationStyle(emails);
      expect(style).toBe('minimal');
    });

    it('should detect frequent punctuation', () => {
      const emails = [
        'Wow! This is amazing! Thanks so much!!!',
        'Really?? That\\'s incredible!!',
        'Can\\'t wait!!! See you soon!!!'
      ];

      const style = StyleAnalyzer.detectPunctuationStyle(emails);
      expect(style).toBe('expressive');
    });
  });

  describe('full analysis integration', () => {
    it('should produce complete writing style', () => {
      const emails = [
        'Hi John,\\n\\nThanks for reaching out about the project. I appreciate your interest.\\n\\nBest regards,\\nFranz',
        'Hello Sarah,\\n\\nI\\'ve reviewed your proposal. Looking forward to discussing further.\\n\\nThanks,\\nFranz',
        'Hi Mike,\\n\\nGreat to hear from you! Let me know if you need any clarification.\\n\\nCheers,\\nFranz'
      ];

      const greetings = StyleAnalyzer.analyzeGreetings(emails);
      const closings = StyleAnalyzer.analyzeClosings(emails);
      const patterns = StyleAnalyzer.analyzeSentencePatterns(emails);
      const formality = StyleAnalyzer.detectFormalityLevel(emails);
      const avgLength = StyleAnalyzer.calculateAverageSentenceLength(emails);
      const punctuation = StyleAnalyzer.detectPunctuationStyle(emails);

      const style: Types.WritingStyle = {
        greetings,
        closings,
        sentencePatterns: patterns,
        vocabulary: [],
        formalityLevel: formality,
        averageSentenceLength: avgLength,
        punctuationStyle: punctuation
      };

      expect(style.greetings).toContain('Hi');
      expect(style.greetings).toContain('Hello');
      expect(style.closings).toContain('Best regards');
      expect(style.closings).toContain('Thanks');
      expect(style.closings).toContain('Cheers');
      expect(style.formalityLevel).toBe(3);
      expect(style.punctuationStyle).toBe('standard');
    });
  });
});