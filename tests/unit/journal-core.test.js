const { JournalCore } = require('../lib/journal-core');
const { NotionAdapter } = require('../lib/notion-adapter');

// Mock Notion client
jest.mock('@notionhq/client', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      databases: {
        query: jest.fn(),
        retrieve: jest.fn()
      },
      pages: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn()
      },
      blocks: {
        children: {
          list: jest.fn(),
          append: jest.fn()
        }
      }
    }))
  };
});

describe('JournalCore', () => {
  let journal;

  beforeEach(() => {
    process.env.NOTION_TOKEN = 'test-token';
    process.env.JOURNAL_DATABASE_ID = 'test-database';
    journal = new JournalCore();
  });

  describe('buildProperties', () => {
    it('should build correct properties for date', () => {
      const props = journal.buildProperties('2026-02-20', {
        mood: ['Focused'],
        summary: 'Test summary'
      });

      expect(props['Daily Journal'].title[0].text.content).toBe('2026-02-20');
      expect(props['How I felt today?'].multi_select).toEqual([{ name: 'Focused' }]);
      expect(props['Anything in particular?'].rich_text[0].text.content).toBe('Test summary');
    });
  });

  describe('detectMood', () => {
    it('should detect Accomplished from content', () => {
      const mood = journal.detectMood('completed the task successfully');
      expect(mood).toContain('Accomplished');
    });

    it('should detect Challenged from content', () => {
      const mood = journal.detectMood('difficult problem to debug');
      expect(mood).toContain('Challenged');
    });

    it('should default to Reflective', () => {
      const mood = journal.detectMood('some random text');
      expect(mood).toEqual(['Reflective']);
    });
  });

  describe('getEmptyTemplate', () => {
    it('should return template with date', () => {
      const template = journal.getEmptyTemplate('2026-02-20');
      
      expect(template.blocks[0].heading_2.rich_text[0].text.content).toContain('2026-02-20');
      expect(template.mood).toEqual(['...']);
      expect(template.summary).toBe('');
    });
  });
});

describe('NotionAdapter', () => {
  let adapter;

  beforeEach(() => {
    process.env.NOTION_TOKEN = 'test-token';
    adapter = new NotionAdapter({ databaseId: 'test-db' });
  });

  it('should throw error without token', () => {
    delete process.env.NOTION_TOKEN;
    expect(() => new NotionAdapter()).toThrow('NOTION_TOKEN is required');
  });

  it('should connect and create client', () => {
    const result = adapter.connect();
    expect(result).toBe(adapter);
    expect(adapter.notion).toBeDefined();
  });
});
