/**
 * notion-journal-skill - Main entry point
 * Production-ready Notion Journal management for OpenClaw
 */

const { JournalCore } = require('./journal-core');
const { NotionAdapter } = require('./notion-adapter');

class NotionJournal {
  constructor(options = {}) {
    this.core = new JournalCore(options);
  }

  /**
   * Create a new journal entry
   */
  async createEntry(entryData) {
    return await this.core.createEntry(entryData);
  }

  /**
   * Generate content from memory files
   */
  async generateContent(date) {
    return await this.core.generateContent(date);
  }

  /**
   * Backfill missing journal dates
   */
  async backfillMissingDates(days = 30) {
    return await this.core.backfillMissingDates(days);
  }

  /**
   * Find entry by date
   */
  async findEntryByDate(date) {
    return await this.core.findEntryByDate(date);
  }

  /**
   * Check database health
   */
  async checkHealth() {
    return await this.core.adapter.checkDatabase();
  }
}

// Export both main class and components
module.exports = {
  NotionJournal,
  JournalCore,
  NotionAdapter
};
