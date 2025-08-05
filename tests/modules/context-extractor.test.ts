import '../../../src/modules/utils';
import '../../../src/modules/types';
import '../../../src/modules/error-handling';
import '../../../src/modules/context-extractor';

describe('ContextExtractor Module', () => {
  describe('extractContext', () => {
    const mockMessage = {
      getId: jest.fn(() => 'msg-123'),
      getThread: jest.fn(),
      getFrom: jest.fn(() => 'John Doe <john@example.com>'),
      getTo: jest.fn(() => 'franz@example.com'),
      getSubject: jest.fn(() => 'Project Update Request'),
      getPlainBody: jest.fn(() => 'Hi Franz,\\n\\nCould you provide an update on the project?\\n\\nThanks,\\nJohn'),
      getDate: jest.fn(() => new Date('2025-01-15T10:00:00Z')),
      getReplyTo: jest.fn(() => 'john@example.com'),
      getAttachments: jest.fn(() => [])
    };

    it('should extract basic email context', () => {
      const mockThread = {
        getId: jest.fn(() => 'thread-123'),
        getMessages: jest.fn(() => [mockMessage])
      };
      mockMessage.getThread.mockReturnValue(mockThread);

      const context = ContextExtractor.extractContext(mockMessage as any);

      expect(context).toEqual({
        messageId: 'msg-123',
        threadId: 'thread-123',
        from: 'John Doe <john@example.com>',
        to: 'franz@example.com',
        subject: 'Project Update Request',
        body: expect.stringContaining('Could you provide an update'),
        date: new Date('2025-01-15T10:00:00Z'),
        isReply: false,
        hasAttachments: false,
        replyTo: 'john@example.com',
        previousMessages: []
      });
    });

    it('should detect reply emails', () => {
      const replyMessage = { ...mockMessage };
      replyMessage.getSubject.mockReturnValue('Re: Project Update Request');
      
      const mockThread = {
        getId: jest.fn(() => 'thread-123'),
        getMessages: jest.fn(() => [mockMessage, replyMessage])
      };
      replyMessage.getThread.mockReturnValue(mockThread);

      const context = ContextExtractor.extractContext(replyMessage as any);

      expect(context.isReply).toBe(true);
      expect(context.previousMessages).toHaveLength(1);
    });

    it('should extract thread context', () => {
      const messages = [
        createMockMessage('msg-1', 'Initial email'),
        createMockMessage('msg-2', 'First reply'),
        createMockMessage('msg-3', 'Second reply')
      ];

      const mockThread = {
        getId: jest.fn(() => 'thread-123'),
        getMessages: jest.fn(() => messages)
      };
      messages[2].getThread.mockReturnValue(mockThread);

      const context = ContextExtractor.extractContext(messages[2] as any);

      expect(context.previousMessages).toHaveLength(2);
      expect(context.previousMessages[0].body).toContain('Initial email');
      expect(context.previousMessages[1].body).toContain('First reply');
    });
  });

  describe('extractSenderInfo', () => {
    it('should extract name and email from standard format', () => {
      const info = ContextExtractor.extractSenderInfo('John Doe <john@example.com>');
      
      expect(info).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        domain: 'example.com'
      });
    });

    it('should handle email-only format', () => {
      const info = ContextExtractor.extractSenderInfo('jane@company.org');
      
      expect(info).toEqual({
        name: 'jane',
        email: 'jane@company.org',
        domain: 'company.org'
      });
    });

    it('should handle complex names', () => {
      const info = ContextExtractor.extractSenderInfo('Dr. Jane Smith, PhD <dr.smith@university.edu>');
      
      expect(info).toEqual({
        name: 'Dr. Jane Smith, PhD',
        email: 'dr.smith@university.edu',
        domain: 'university.edu'
      });
    });

    it('should handle malformed input', () => {
      const info = ContextExtractor.extractSenderInfo('invalid-email');
      
      expect(info).toEqual({
        name: 'invalid-email',
        email: 'invalid-email',
        domain: ''
      });
    });
  });

  describe('extractActionItems', () => {
    it('should identify explicit action items', () => {
      const email = `
        Hi Team,
        
        Please complete the following by Friday:
        • Review the proposal document
        • Send feedback via email
        • Schedule a follow-up meeting
        
        Let me know if you have questions.
      `;

      const actions = ContextExtractor.extractActionItems(email);

      expect(actions).toContain('Review the proposal document');
      expect(actions).toContain('Send feedback via email');
      expect(actions).toContain('Schedule a follow-up meeting');
    });

    it('should identify implicit action requests', () => {
      const email = 'Could you please send me the report? Also, can you confirm the meeting time?';

      const actions = ContextExtractor.extractActionItems(email);

      expect(actions.some(a => a.includes('send') && a.includes('report'))).toBe(true);
      expect(actions.some(a => a.includes('confirm') && a.includes('meeting'))).toBe(true);
    });

    it('should handle emails without actions', () => {
      const email = 'Thank you for the update. Everything looks good.';

      const actions = ContextExtractor.extractActionItems(email);

      expect(actions).toEqual([]);
    });
  });

  describe('extractDeadlines', () => {
    it('should extract explicit deadlines', () => {
      const email = 'Please submit the report by Friday, January 20th at 5 PM.';

      const deadlines = ContextExtractor.extractDeadlines(email);

      expect(deadlines).toContain('Friday, January 20th at 5 PM');
    });

    it('should extract relative deadlines', () => {
      const email = 'This needs to be done by end of day tomorrow. The proposal is due next week.';

      const deadlines = ContextExtractor.extractDeadlines(email);

      expect(deadlines.some(d => d.includes('tomorrow'))).toBe(true);
      expect(deadlines.some(d => d.includes('next week'))).toBe(true);
    });

    it('should handle multiple deadline formats', () => {
      const email = `
        Key dates:
        - January 15: Initial draft
        - Jan 20th: Review complete
        - 1/25: Final submission
      `;

      const deadlines = ContextExtractor.extractDeadlines(email);

      expect(deadlines.length).toBeGreaterThan(0);
      expect(deadlines.some(d => d.includes('January 15'))).toBe(true);
    });
  });

  describe('extractQuestions', () => {
    it('should extract direct questions', () => {
      const email = 'What time works best for you? Can we meet on Tuesday?';

      const questions = ContextExtractor.extractQuestions(email);

      expect(questions).toContain('What time works best for you?');
      expect(questions).toContain('Can we meet on Tuesday?');
    });

    it('should extract indirect questions', () => {
      const email = 'I was wondering if you could help. Let me know when you are available.';

      const questions = ContextExtractor.extractQuestions(email);

      expect(questions.length).toBeGreaterThan(0);
    });

    it('should handle emails without questions', () => {
      const email = 'Thank you for your help. I appreciate it.';

      const questions = ContextExtractor.extractQuestions(email);

      expect(questions).toEqual([]);
    });
  });

  describe('categorizeEmail', () => {
    it('should categorize request emails', () => {
      const email = 'Could you please review this document and provide feedback?';
      const category = ContextExtractor.categorizeEmail(email);
      expect(category).toBe('request');
    });

    it('should categorize question emails', () => {
      const email = 'What is the status of the project? When can we expect completion?';
      const category = ContextExtractor.categorizeEmail(email);
      expect(category).toBe('question');
    });

    it('should categorize information emails', () => {
      const email = 'Just wanted to let you know that the meeting has been moved to 3 PM.';
      const category = ContextExtractor.categorizeEmail(email);
      expect(category).toBe('information');
    });

    it('should categorize thank you emails', () => {
      const email = 'Thank you so much for your help with the presentation!';
      const category = ContextExtractor.categorizeEmail(email);
      expect(category).toBe('thanks');
    });

    it('should categorize follow-up emails', () => {
      const email = 'Following up on our conversation yesterday about the budget.';
      const category = ContextExtractor.categorizeEmail(email);
      expect(category).toBe('followup');
    });
  });

  describe('extractPriority', () => {
    it('should identify high priority emails', () => {
      const email = 'URGENT: Need this completed by end of day!';
      const priority = ContextExtractor.extractPriority(email);
      expect(priority).toBe('high');
    });

    it('should identify medium priority emails', () => {
      const email = 'When you get a chance, could you review this?';
      const priority = ContextExtractor.extractPriority(email);
      expect(priority).toBe('medium');
    });

    it('should identify low priority emails', () => {
      const email = 'FYI - No action needed, just keeping you in the loop.';
      const priority = ContextExtractor.extractPriority(email);
      expect(priority).toBe('low');
    });
  });
});

function createMockMessage(id: string, body: string) {
  return {
    getId: jest.fn(() => id),
    getFrom: jest.fn(() => 'sender@example.com'),
    getTo: jest.fn(() => 'recipient@example.com'),
    getSubject: jest.fn(() => 'Test Subject'),
    getPlainBody: jest.fn(() => body),
    getDate: jest.fn(() => new Date()),
    getThread: jest.fn(),
    getReplyTo: jest.fn(() => 'sender@example.com'),
    getAttachments: jest.fn(() => [])
  };
}