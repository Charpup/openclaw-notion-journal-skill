/**
 * NotionAdapter - Adapter layer for Notion API operations
 * Encapsulates all direct Notion API calls
 */

const { Client } = require('@notionhq/client');

class NotionAdapter {
  constructor(options = {}) {
    this.token = options.token || process.env.NOTION_TOKEN;
    this.databaseId = options.databaseId || process.env.JOURNAL_DATABASE_ID;
    this.notion = null;
    
    if (!this.token) {
      throw new Error('NOTION_TOKEN is required');
    }
  }

  /**
   * Initialize Notion client
   */
  connect() {
    if (!this.notion) {
      this.notion = new Client({ auth: this.token });
    }
    return this;
  }

  /**
   * Query database entries
   */
  async queryDatabase(filter = {}, sorts = [], pageSize = 100) {
    this.connect();
    
    const response = await this.notion.databases.query({
      database_id: this.databaseId,
      filter,
      sorts,
      page_size: pageSize
    });
    
    return response.results;
  }

  /**
   * Create a new page in database
   */
  async createPage(properties, children = []) {
    this.connect();
    
    const page = await this.notion.pages.create({
      parent: { database_id: this.databaseId },
      properties,
      children
    });
    
    return page;
  }

  /**
   * Get page details
   */
  async getPage(pageId) {
    this.connect();
    return await this.notion.pages.retrieve({ page_id: pageId });
  }

  /**
   * Update page properties
   */
  async updatePage(pageId, properties) {
    this.connect();
    return await this.notion.pages.update({
      page_id: pageId,
      properties
    });
  }

  /**
   * Archive (soft delete) page
   */
  async archivePage(pageId) {
    this.connect();
    return await this.notion.pages.update({
      page_id: pageId,
      in_trash: true
    });
  }

  /**
   * Get page content blocks
   */
  async getBlockChildren(blockId) {
    this.connect();
    
    const response = await this.notion.blocks.children.list({
      block_id: blockId,
      page_size: 100
    });
    
    return response.results;
  }

  /**
   * Append blocks to page
   */
  async appendBlocks(pageId, children) {
    this.connect();
    
    return await this.notion.blocks.children.append({
      block_id: pageId,
      children
    });
  }

  /**
   * Check if database exists and is accessible
   */
  async checkDatabase() {
    try {
      this.connect();
      await this.notion.databases.retrieve({ database_id: this.databaseId });
      return { exists: true, accessible: true };
    } catch (error) {
      if (error.code === 'object_not_found') {
        return { exists: false, accessible: false };
      }
      throw error;
    }
  }
}

module.exports = { NotionAdapter };
