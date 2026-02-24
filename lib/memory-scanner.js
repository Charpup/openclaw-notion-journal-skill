/**
 * MemoryScanner - Scan and parse memory files for a specific date
 * v1.1.0 - Comprehensive memory scanning
 */

const fs = require('fs');
const path = require('path');

class MemoryScanner {
  constructor(options = {}) {
    this.memoryPath = options.memoryPath || '/root/.openclaw/workspace/memory';
  }

  /**
   * Scan all memory files for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Array<MemoryFile>} Array of parsed memory files
   */
  async scanDate(date) {
    const pattern = new RegExp(`^${date}.*\\.md$`);
    const files = fs.readdirSync(this.memoryPath)
      .filter(f => pattern.test(f))
      .map(f => ({
        filename: f,
        filepath: path.join(this.memoryPath, f),
        stats: fs.statSync(path.join(this.memoryPath, f))
      }))
      .sort((a, b) => a.stats.mtime - b.stats.mtime);

    const parsedFiles = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(file.filepath, 'utf8');
        const parsed = this.parseMemoryFile(file.filename, content);
        parsedFiles.push(parsed);
      } catch (error) {
        console.warn(`Failed to parse ${file.filename}:`, error.message);
      }
    }

    return parsedFiles;
  }

  /**
   * Parse a memory file and extract structured information
   * @param {string} filename - Memory filename
   * @param {string} content - File content
   * @returns {MemoryFile} Parsed memory file structure
   */
  parseMemoryFile(filename, content) {
    const type = this.detectFileType(filename, content);
    const sections = this.extractSections(content);
    
    return {
      filename,
      type,
      sections,
      summary: this.generateSummary(type, sections),
      timestamp: this.extractTimestamp(content),
      raw: content
    };
  }

  /**
   * Detect memory file type based on filename and content
   */
  detectFileType(filename, content) {
    if (filename.includes('_briefing')) return 'briefing';
    if (filename.includes('_session')) return 'session';
    if (filename.includes('-session')) return 'session';
    if (content.includes('System Snapshot')) return 'snapshot';
    if (content.includes('## Session')) return 'session';
    if (content.includes('Moltbook Daily Briefing')) return 'briefing';
    return 'general';
  }

  /**
   * Extract sections from markdown content
   */
  extractSections(content) {
    const sections = [];
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      const startIndex = match.index;
      
      // Find next heading or end of content
      const nextMatch = headingRegex.exec(content);
      const endIndex = nextMatch ? nextMatch.index : content.length;
      headingRegex.lastIndex = startIndex + 1; // Reset for next iteration
      
      const sectionContent = content.slice(startIndex, endIndex).trim();
      
      sections.push({
        level,
        title,
        content: sectionContent,
        keyPoints: this.extractKeyPoints(sectionContent)
      });
    }

    return sections;
  }

  /**
   * Extract key points from section content
   */
  extractKeyPoints(content) {
    const points = [];
    
    // Extract list items
    const listRegex = /^[-*]\s+(.+)$/gm;
    let match;
    while ((match = listRegex.exec(content)) !== null) {
      points.push(match[1].trim());
    }

    // Extract completed tasks
    const taskRegex = /^(?:[-*]\s+)?\[x\]\s+(.+)$/gmi;
    while ((match = taskRegex.exec(content)) !== null) {
      points.push(`✅ ${match[1].trim()}`);
    }

    // Extract URLs/links
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    while ((match = urlRegex.exec(content)) !== null) {
      points.push(`🔗 ${match[1]}`);
    }

    return points.slice(0, 5); // Limit to 5 key points
  }

  /**
   * Generate a summary for the memory file
   */
  generateSummary(type, sections) {
    const sectionTitles = sections.map(s => s.title).join(', ');
    
    switch (type) {
      case 'snapshot':
        return `System health monitoring: ${sectionTitles}`;
      case 'session':
        return `Work session: ${sectionTitles}`;
      case 'briefing':
        return `Daily intelligence briefing: ${sectionTitles}`;
      default:
        return `Activity log: ${sectionTitles || 'General notes'}`;
    }
  }

  /**
   * Extract timestamp from content
   */
  extractTimestamp(content) {
    const timestampRegex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/;
    const match = content.match(timestampRegex);
    return match ? match[1] : null;
  }

  /**
   * Get statistics about memory files for a date
   */
  async getStats(date) {
    const files = await this.scanDate(date);
    
    const stats = {
      totalFiles: files.length,
      byType: {},
      totalSections: 0,
      keyActivities: []
    };

    for (const file of files) {
      stats.byType[file.type] = (stats.byType[file.type] || 0) + 1;
      stats.totalSections += file.sections.length;
      
      // Collect key activities from all sections
      for (const section of file.sections) {
        stats.keyActivities.push(...section.keyPoints.slice(0, 2));
      }
    }

    stats.keyActivities = [...new Set(stats.keyActivities)].slice(0, 10);
    
    return stats;
  }
}

module.exports = { MemoryScanner };
