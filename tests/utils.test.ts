import '../src/modules/logger';
import '../src/modules/utils';

describe('Utils Module', () => {
  describe('truncate', () => {
    it('should truncate long strings', () => {
      const result = Utils.truncate('This is a very long string that needs to be truncated', 20);
      expect(result).toBe('This is a very long...');
    });

    it('should not truncate short strings', () => {
      const result = Utils.truncate('Short string', 20);
      expect(result).toBe('Short string');
    });

    it('should handle empty strings', () => {
      const result = Utils.truncate('', 10);
      expect(result).toBe('');
    });
  });

  describe('cleanEmailBody', () => {
    it('should remove excessive whitespace', () => {
      const result = Utils.cleanEmailBody('Hello    world   \n\n\n   test');
      expect(result).toBe('Hello world test');
    });

    it('should remove email signatures', () => {
      const result = Utils.cleanEmailBody('Hello\n--\nJohn Doe\nSent from my iPhone');
      expect(result).toBe('Hello');
    });

    it('should handle Outlook signatures', () => {
      const result = Utils.cleanEmailBody('Hello\nGet Outlook for iOS');
      expect(result).toBe('Hello');
    });
  });

  describe('extractSenderName', () => {
    it('should extract name from email with name', () => {
      const result = Utils.extractSenderName('John Doe <john@example.com>');
      expect(result).toBe('John');
    });

    it('should handle email without name', () => {
      const result = Utils.extractSenderName('john@example.com');
      expect(result).toBe('john');
    });

    it('should handle complex names', () => {
      const result = Utils.extractSenderName('Dr. Jane Smith, PhD <jane@university.edu>');
      expect(result).toBe('Dr. Jane');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const result = Utils.formatDate(date);
      expect(result).toContain('2025');
    });
  });

  describe('parseJsonSafe', () => {
    it('should parse valid JSON', () => {
      const result = Utils.parseJsonSafe('{"key": "value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return default for invalid JSON', () => {
      const defaultValue = { default: true };
      const result = Utils.parseJsonSafe('invalid json', defaultValue);
      expect(result).toBe(defaultValue);
    });

    it('should handle null input', () => {
      const result = Utils.parseJsonSafe(null as any, 'default');
      expect(result).toBe('default');
    });
  });

  // sanitizeHtml tests removed as function doesn't exist in utils module

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(Utils.isValidEmail('test@example.com')).toBe(true);
      expect(Utils.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(Utils.isValidEmail('notanemail')).toBe(false);
      expect(Utils.isValidEmail('@example.com')).toBe(false);
      expect(Utils.isValidEmail('test@')).toBe(false);
    });
  });
});