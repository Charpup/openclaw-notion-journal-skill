/**
 * NotionAdapter - Adapter layer for Notion API operations
 * Encapsulates all direct Notion API calls
 * v1.1.0 - Fixed initialization issue
 */

const { Client } = require('@notionhq/client');

class NotionAdapter {
  constructor(options = {}) {
    this.token = options.token || process.env.NOTION_TOKEN;
    this.databaseId = options.databaseId || process.env.JOURNAL_DATABASE_ID;
    
    if (!this.token) {
      throw new Error('NOTION_TOKEN is required');
    }
    
    // Initialize client immediately in constructor
    this.notion = new Client({ auth: this.token });
  }

  /**
   * Query database entries
   */
  async queryDatabase(filter = {}, sorts = [], pageSize = 100) {
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
    return await this.notion.pages.retrieve({ page_id: pageId });
  }

  /**
   * Update page properties
   */
  async updatePage(pageId, properties) {
    return await this.notion.pages.update({
      page_id: pageId,
      properties
    });
  }

  /**
   * Archive (soft delete) page
   */
  async archivePage(pageId) {
    return await this.notion.pages.update({
      page_id: pageId,
      in_trash: true
    });
  }

  /**
   * Get page content blocks
   */
  async getBlockChildren(blockId) {
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
