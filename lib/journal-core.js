/**
 * JournalCore - Core journal management functionality
 */

const { NotionAdapter } = require('./notion-adapter');
const fs = require('fs');
const path = require('path');

class JournalCore {
  constructor(options = {}) {
    this.adapter = new NotionAdapter(options);
    this.databaseId = options.databaseId || process.env.JOURNAL_DATABASE_ID;
    this.memoryPath = options.memoryPath || '/root/.openclaw/workspace/memory';
  }

  /**
   * Create a new journal entry
   */
  async createEntry(entryData) {
    try {
      const { title, date, content, template = 'daily', metadata = {} } = entryData;
      const entryDate = date || title;

      // Check for duplicates
      const existing = await this.findEntryByDate(entryDate);
      if (existing) {
        return {
          success: true,
          data: {
            id: existing.id,
            url: existing.url,
            existed: true,
            message: 'Entry already exists'
          }
        };
      }

      // Generate content if not provided
      let entryContent = content;
      if (!entryContent || !entryContent.blocks) {
        const generated = await this.generateContent(entryDate);
        entryContent = { blocks: generated.blocks };
      }

      // Build properties
      const properties = this.buildProperties(entryDate, metadata);

      // Create entry
      const page = await this.adapter.createPage(properties, entryContent.blocks);

      return {
        success: true,
        data: {
          id: page.id,
          url: page.url,
          createdAt: page.created_time,
          existed: false
        }
      };

    } catch (error) {
      return this.handleError(error, 'createEntry');
    }
  }

  /**
   * Find entry by date
   */
  async findEntryByDate(date) {
    const entries = await this.adapter.queryDatabase({
      property: 'Daily Journal',
      title: {
        contains: date
      }
    });

    return entries.length > 0 ? entries[0] : null;
  }

  /**
   * Generate content from memory files
   */
  async generateContent(date) {
    try {
      // Scan memory files for date
      const memoryFiles = this.findMemoryFiles(date);
      
      if (memoryFiles.length === 0) {
        return this.getEmptyTemplate(date);
      }

      // Read and merge content
      const activities = [];
      let summary = '';

      for (const file of memoryFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').filter(l => l.trim());
        
        // Extract key activities (headings and bullet points)
        for (const line of lines) {
          if (line.startsWith('## ') || line.startsWith('### ')) {
            activities.push(line.replace(/^#+ /, ''));
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            activities.push(line.replace(/^[-*] /, ''));
          }
        }

        // Use first non-heading line as summary base
        if (!summary) {
          const firstLine = lines.find(l => !l.startsWith('#') && l.trim());
          if (firstLine) summary = firstLine.slice(0, 200);
        }
      }

      // Detect mood from content
      const mood = this.detectMood(memoryFiles.map(f => fs.readFileSync(f, 'utf8')).join(' '));

      // Build Notion blocks
      const blocks = [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: `📓 Journal Entry — ${date}` } }]
          }
        },
        {
          object: 'block',
          type: 'divider',
          divider: {}
        }
      ];

      // Add activities
      if (activities.length > 0) {
        blocks.push({
          object: 'block',
          type: 'heading_3',
          heading_3: {
            rich_text: [{ text: { content: '🎯 Key Activities' } }]
          }
        });

        for (const activity of activities.slice(0, 8)) {
          blocks.push({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ text: { content: activity } }]
            }
          });
        }
      }

      // Add summary paragraph
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ text: { content: summary || 'No summary available.' } }]
        }
      });

      return {
        blocks,
        summary,
        mood,
        activityCount: activities.length
      };

    } catch (error) {
      console.error('Generate content error:', error);
      return this.getEmptyTemplate(date);
    }
  }

  /**
   * Find memory files for date
   */
  findMemoryFiles(date) {
    const files = [];
    const baseName = path.join(this.memoryPath, date);

    // Check for exact match
    if (fs.existsSync(`${baseName}.md`)) {
      files.push(`${baseName}.md`);
    }

    // Check for files with suffix
    try {
      const dirFiles = fs.readdirSync(this.memoryPath);
      for (const file of dirFiles) {
        if (file.startsWith(date) && file.endsWith('.md')) {
          files.push(path.join(this.memoryPath, file));
        }
      }
    } catch (e) {
      // Directory might not exist
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Detect mood from content
   */
  detectMood(content) {
    const moodKeywords = {
      'Accomplished': ['completed', 'success', 'achieved', 'done', 'finished'],
      'Focused': ['deep work', 'concentrated', 'flow', 'immersed'],
      'Productive': ['efficient', 'progress', 'output', 'delivered'],
      'Challenged': ['difficult', 'complex', 'problem', 'debug', 'fix'],
      'Reflective': ['think', 'consider', 'analysis', 'review', 'learn'],
      'Relaxed': ['calm', 'peaceful', 'easy', 'smooth'],
      'Energetic': ['excited', 'motivated', 'enthusiastic', 'drive']
    };

    const contentLower = content.toLowerCase();
    const detectedMoods = [];

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(kw => contentLower.includes(kw))) {
        detectedMoods.push(mood);
      }
    }

    return detectedMoods.length > 0 ? detectedMoods : ['Reflective'];
  }

  /**
   * Build Notion properties
   */
  buildProperties(date, metadata) {
    return {
      'Daily Journal': {
        title: [{ text: { content: date } }]
      },
      'How I felt today?': {
        multi_select: (metadata.mood || []).map(m => ({ name: m }))
      },
      'Anything in particular?': {
        rich_text: [{ text: { content: metadata.summary || '' } }]
      }
    };
  }

  /**
   * Get empty template
   */
  getEmptyTemplate(date) {
    return {
      blocks: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: `📓 Journal Entry — ${date}` } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ 
              text: { content: '[今日待补充]' },
              annotations: { italic: true, color: 'gray' }
            }]
          }
        }
      ],
      summary: '',
      mood: ['...'],
      activityCount: 0
    };
  }

  /**
   * Backfill missing dates
   */
  async backfillMissingDates(days = 30) {
    const results = {
      scanned: 0,
      missing: 0,
      created: 0,
      entries: []
    };

    try {
      // Get existing entries
      const existingEntries = await this.adapter.queryDatabase({}, [], 100);
      const existingDates = new Set(
        existingEntries.map(e => {
          const title = e.properties['Daily Journal']?.title?.[0]?.plain_text;
          return title;
        }).filter(Boolean)
      );

      // Scan last N days
      const today = new Date();
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        results.scanned++;

        if (!existingDates.has(dateStr)) {
          results.missing++;

          // Create entry
          const createResult = await this.createEntry({
            title: dateStr,
            date: dateStr
          });

          if (createResult.success) {
            results.created++;
            results.entries.push({
              date: dateStr,
              id: createResult.data.id,
              status: createResult.data.existed ? 'exists' : 'created'
            });
          } else {
            results.entries.push({
              date: dateStr,
              status: 'failed',
              error: createResult.error?.message
            });
          }
        }
      }

      return { success: true, data: results };

    } catch (error) {
      return this.handleError(error, 'backfillMissingDates');
    }
  }

  /**
   * Handle errors uniformly
   */
  handleError(error, operation) {
    const errorTypes = {
      'object_not_found': { type: 'NotFoundError', code: 'NJ_NF_001' },
      'unauthorized': { type: 'AuthenticationError', code: 'NJ_AUTH_001' },
      'rate_limited': { type: 'RateLimitError', code: 'NJ_RATE_001' },
      'validation_error': { type: 'ValidationError', code: 'NJ_VAL_001' }
    };

    const errorInfo = errorTypes[error.code] || { 
      type: 'JournalError', 
      code: 'NJ_UNKNOWN' 
    };

    return {
      success: false,
      error: {
        type: errorInfo.type,
        code: errorInfo.code,
        message: error.message,
        operation,
        suggestion: this.getErrorSuggestion(error.code)
      }
    };
  }

  getErrorSuggestion(code) {
    const suggestions = {
      'NJ_NF_001': 'Check that the database ID is correct and the integration has access.',
      'NJ_AUTH_001': 'Verify your NOTION_TOKEN is valid and has not expired.',
      'NJ_RATE_001': 'Wait a moment and retry. Notion API has rate limits.',
      'NJ_VAL_001': 'Check your input data format matches the expected schema.'
    };
    return suggestions[code] || 'Check the error details and retry.';
  }
}

module.exports = { JournalCore };
