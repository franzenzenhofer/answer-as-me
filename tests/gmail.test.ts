import '../src/modules/types';
import '../src/modules/config';
import '../src/modules/logger';
import '../src/modules/utils';
import '../src/modules/gmail';

declare const global: any;

describe('Gmail Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentMessage', () => {
    it('should get message from event context', () => {
      const mockMessage = {
        getId: jest.fn(() => 'msg-123'),
        getSubject: jest.fn(() => 'Test Subject')
      };

      const event = {
        gmail: {
          messageId: 'msg-123'
        }
      };

      global.GmailApp.getMessageById.mockReturnValue(mockMessage);

      const result = GmailService.getCurrentMessage(event);

      expect(result).toBe(mockMessage);
      expect(global.GmailApp.getMessageById).toHaveBeenCalledWith('msg-123');
    });

    it('should return null if no message ID', () => {
      const event = { gmail: {} };
      const result = GmailService.getCurrentMessage(event);
      expect(result).toBeNull();
    });

    it('should handle missing message', () => {
      const event = {
        gmail: { messageId: 'invalid-id' }
      };

      global.GmailApp.getMessageById.mockImplementation(() => {
        throw new Error('Message not found');
      });

      const result = GmailService.getCurrentMessage(event);
      expect(result).toBeNull();
    });
  });

  describe('getEmailContext', () => {
    const mockMessage = {
      getId: jest.fn(() => 'msg-123'),
      getThread: jest.fn(),
      getFrom: jest.fn(() => 'John Doe <john@example.com>'),
      getTo: jest.fn(() => 'franz@example.com'),
      getSubject: jest.fn(() => 'Test Subject'),
      getPlainBody: jest.fn(() => 'This is the email body'),
      getDate: jest.fn(() => new Date('2025-01-15')),
      getReplyTo: jest.fn(() => 'john@example.com'),
      getAttachments: jest.fn(() => [])
    };

    it('should extract email context correctly', () => {
      const mockThread = {
        getId: jest.fn(() => 'thread-123'),
        getMessages: jest.fn(() => [mockMessage])
      };

      mockMessage.getThread.mockReturnValue(mockThread);

      const context = GmailService.getEmailContext(mockMessage as any);

      expect(context).toEqual({
        messageId: 'msg-123',
        threadId: 'thread-123',
        from: 'John Doe <john@example.com>',
        to: 'franz@example.com',
        subject: 'Test Subject',
        body: 'This is the email body',
        date: new Date('2025-01-15'),
        isReply: false,
        hasAttachments: false,
        replyTo: 'john@example.com',
        previousMessages: []
      });
    });

    it('should detect replies', () => {
      mockMessage.getSubject.mockReturnValue('Re: Test Subject');
      
      const mockThread = {
        getId: jest.fn(() => 'thread-123'),
        getMessages: jest.fn(() => [mockMessage, mockMessage])
      };

      mockMessage.getThread.mockReturnValue(mockThread);

      const context = GmailService.getEmailContext(mockMessage as any);

      expect(context.isReply).toBe(true);
      expect(context.previousMessages).toHaveLength(1);
    });

    it('should detect attachments', () => {
      mockMessage.getAttachments.mockReturnValue([{ getName: () => 'file.pdf' }]);
      
      const mockThread = {
        getId: jest.fn(() => 'thread-123'),
        getMessages: jest.fn(() => [mockMessage])
      };

      mockMessage.getThread.mockReturnValue(mockThread);

      const context = GmailService.getEmailContext(mockMessage as any);

      expect(context.hasAttachments).toBe(true);
    });

    it('should clean email body', () => {
      mockMessage.getPlainBody.mockReturnValue('  Too    much   whitespace  ');
      
      const mockThread = {
        getId: jest.fn(() => 'thread-123'),
        getMessages: jest.fn(() => [mockMessage])
      };

      mockMessage.getThread.mockReturnValue(mockThread);

      const context = GmailService.getEmailContext(mockMessage as any);

      expect(context.body).toBe('Too much whitespace');
    });
  });

  describe('createDraftReply', () => {
    const mockMessage = {
      getThread: jest.fn(),
      createDraftReply: jest.fn()
    };

    it('should create draft reply', () => {
      const mockThread = { getId: jest.fn(() => 'thread-123') };
      const mockDraft = { 
        getId: jest.fn(() => 'draft-123'),
        getMessage: jest.fn(() => ({ getSubject: jest.fn() }))
      };

      mockMessage.getThread.mockReturnValue(mockThread);
      mockMessage.createDraftReply.mockReturnValue(mockDraft);

      const result = GmailService.createDraftReply(
        mockMessage as any,
        'This is my reply'
      );

      expect(result).toBe(mockDraft);
      expect(mockMessage.createDraftReply).toHaveBeenCalledWith('This is my reply');
    });

    it('should handle draft creation errors', () => {
      mockMessage.createDraftReply.mockImplementation(() => {
        throw new Error('Failed to create draft');
      });

      expect(() => {
        GmailService.createDraftReply(mockMessage as any, 'Reply');
      }).toThrow('Failed to create draft');
    });
  });

  describe('sendReply', () => {
    const mockMessage = {
      getThread: jest.fn(),
      reply: jest.fn()
    };

    it('should send reply successfully', () => {
      const mockThread = { getId: jest.fn(() => 'thread-123') };
      mockMessage.getThread.mockReturnValue(mockThread);

      GmailService.sendReply(mockMessage as any, 'My reply');

      expect(mockMessage.reply).toHaveBeenCalledWith('My reply');
      expect(global.Logger.log).toHaveBeenCalledWith('[INFO] Reply sent to thread: thread-123');
    });

    it('should handle send errors', () => {
      mockMessage.reply.mockImplementation(() => {
        throw new Error('Send failed');
      });

      expect(() => {
        GmailService.sendReply(mockMessage as any, 'Reply');
      }).toThrow('Send failed');
    });
  });

  describe('updateDraft', () => {
    it('should update existing draft', () => {
      const mockDraft = {
        getId: jest.fn(() => 'draft-123'),
        update: jest.fn(),
        getMessage: jest.fn(() => ({
          getSubject: jest.fn(() => 'Subject'),
          getTo: jest.fn(() => 'to@example.com')
        }))
      };

      const mockDrafts = [mockDraft];
      global.GmailApp.getDrafts.mockReturnValue(mockDrafts);

      const result = GmailService.updateDraft('draft-123', 'Updated content');

      expect(result).toBe(true);
      expect(mockDraft.update).toHaveBeenCalledWith(
        'to@example.com',
        'Subject',
        'Updated content'
      );
    });

    it('should return false if draft not found', () => {
      global.GmailApp.getDrafts.mockReturnValue([]);

      const result = GmailService.updateDraft('invalid-id', 'Content');

      expect(result).toBe(false);
    });

    it('should handle update errors', () => {
      const mockDraft = {
        getId: jest.fn(() => 'draft-123'),
        update: jest.fn(() => { throw new Error('Update failed'); }),
        getMessage: jest.fn(() => ({
          getSubject: jest.fn(() => 'Subject'),
          getTo: jest.fn(() => 'to@example.com')
        }))
      };

      global.GmailApp.getDrafts.mockReturnValue([mockDraft]);

      const result = GmailService.updateDraft('draft-123', 'Content');

      expect(result).toBe(false);
    });
  });

  describe('extractMessageData', () => {
    const mockMessage = {
      getId: jest.fn(() => 'msg-123'),
      getFrom: jest.fn(() => 'sender@example.com'),
      getTo: jest.fn(() => 'recipient@example.com'),
      getSubject: jest.fn(() => 'Email Subject'),
      getPlainBody: jest.fn(() => 'Email body content'),
      getDate: jest.fn(() => new Date('2025-01-15'))
    };

    it('should extract message data correctly', () => {
      const result = GmailService.extractMessageData(mockMessage as any);

      expect(result).toEqual({
        id: 'msg-123',
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Email Subject',
        body: 'Email body content',
        date: new Date('2025-01-15')
      });
    });

    it('should clean the body text', () => {
      mockMessage.getPlainBody.mockReturnValue('  Lots   of   spaces  ');

      const result = GmailService.extractMessageData(mockMessage as any);

      expect(result.body).toBe('Lots of spaces');
    });

    it('should truncate long subjects', () => {
      const longSubject = 'A'.repeat(300);
      mockMessage.getSubject.mockReturnValue(longSubject);

      const result = GmailService.extractMessageData(mockMessage as any);

      expect(result.subject.length).toBeLessThanOrEqual(255);
      expect(result.subject).toContain('...');
    });
  });

  describe('error handling', () => {
    it('should log errors when getting current message fails', () => {
      const event = { gmail: { messageId: 'msg-123' } };
      
      global.GmailApp.getMessageById.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = GmailService.getCurrentMessage(event);

      expect(result).toBeNull();
      expect(global.Logger.log).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Failed to get current message')
      );
    });
  });
});