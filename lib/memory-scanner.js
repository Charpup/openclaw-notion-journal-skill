/**
 * MemoryScanner - Scan and parse memory files for a specific date
 * v2.0.0 - Enhanced with multi-directory traversal and subagent support
 */

const fs = require('fs');
const path = require('path');

class MemoryScanner {
  constructor(options = {}) {
    // v2.0.0: Support multiple memory paths
    this.memoryPaths = options.memoryPaths || [
      '/root/.openclaw/workspace/memory',
      '/root/.openclaw/memory'
    ];
    this.singlePath = options.memoryPath; // Legacy support
  }

  /**
   * Get all memory paths to search
   * @returns {Array<string>} Array of paths to search
   */
  getSearchPaths() {
    if (this.singlePath) {
      return [this.singlePath];
    }
    return this.memoryPaths.filter(p => fs.existsSync(p));
  }

  /**
   * Scan all memory files for a specific date across all directories
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Array<MemoryFile>} Array of parsed memory files
   */
  async scanDate(date) {
    const pattern = new RegExp(`^${date}.*\\.md$`);
    const searchPaths = this.getSearchPaths();
    const allFiles = [];

    console.log(`[MemoryScanner] Scanning for ${date} in ${searchPaths.length} directories...`);

    for (const basePath of searchPaths) {
      try {
        const files = await this.scanDirectory(basePath, pattern);
        allFiles.push(...files);
      } catch (error) {
        console.warn(`[MemoryScanner] Failed to scan ${basePath}:`, error.message);
      }
    }

    // Sort by modification time (oldest first for chronological order)
    allFiles.sort((a, b) => a.stats.mtime - b.stats.mtime);

    console.log(`[MemoryScanner] Found ${allFiles.length} files total`);

    // Parse each file
    const parsedFiles = [];
    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(file.filepath, 'utf8');
        const parsed = this.parseMemoryFile(file.filename, content, file.filepath);
        parsedFiles.push(parsed);
      } catch (error) {
        console.warn(`[MemoryScanner] Failed to parse ${file.filename}:`, error.message);
      }
    }

    return parsedFiles;
  }

  /**
   * Recursively scan a directory for matching files
   * @param {string} dirPath - Directory to scan
   * @param {RegExp} pattern - Filename pattern to match
   * @returns {Array<Object>} Matching files with metadata
   */
  async scanDirectory(dirPath, pattern) {
    const files = [];
    
    const scanRecursive = (currentPath) => {
      try {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          
          if (entry.isDirectory()) {
            // Recurse into subdirectories
            scanRecursive(fullPath);
          } else if (entry.isFile() && pattern.test(entry.name)) {
            const stats = fs.statSync(fullPath);
            files.push({
              filename: entry.name,
              filepath: fullPath,
              directory: currentPath,
              stats: {
                size: stats.size,
                mtime: stats.mtime,
                ctime: stats.ctime
              }
            });
          }
        }
      } catch (error) {
        // Handle permission errors gracefully
        if (error.code !== 'EACCES' && error.code !== 'EPERM') {
          console.warn(`[MemoryScanner] Error scanning ${currentPath}:`, error.message);
        }
      }
    };

    scanRecursive(dirPath);
    return files;
  }

  /**
   * Parse a memory file and extract structured information
   * @param {string} filename - Memory filename
   * @param {string} content - File content
   * @param {string} filepath - Full file path
   * @returns {MemoryFile} Parsed memory file structure
   */
  parseMemoryFile(filename, content, filepath) {
    const type = this.detectFileType(filename, content);
    const sections = this.extractSections(content);
    
    return {
      filename,
      filepath,
      type,
      sections,
      summary: this.generateSummary(type, sections),
      timestamp: this.extractTimestamp(content),
      raw: content,
      metadata: {
        lineCount: content.split('\n').length,
        charCount: content.length,
        hasTasks: content.includes('[x]') || content.includes('[ ]'),
        hasLinks: /https?:\/\//.test(content)
      }
    };
  }

  /**
   * Detect memory file type based on filename and content
   * @param {string} filename - Memory filename
   * @param {string} content - File content
   * @returns {string} File type: 'snapshot' | 'session' | 'briefing' | 'general'
   */
  detectFileType(filename, content) {
    const lowerContent = content.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // Check filename patterns first
    if (lowerFilename.includes('_briefing') || lowerFilename.includes('-briefing')) return 'briefing';
    if (lowerFilename.includes('_session') || lowerFilename.includes('-session')) return 'session';
    if (lowerFilename.includes('_snapshot') || lowerFilename.includes('-snapshot')) return 'snapshot';
    
    // Check content patterns
    if (lowerContent.includes('system snapshot') || 
        lowerContent.includes('uptime') && lowerContent.includes('load average')) {
      return 'snapshot';
    }
    if (lowerContent.includes('## session') || 
        lowerContent.includes('work session') ||
        lowerContent.includes('## work log')) {
      return 'session';
    }
    if (lowerContent.includes('moltbook') || 
        lowerContent.includes('evomap') ||
        lowerContent.includes('daily briefing') ||
        lowerContent.includes('intelligence briefing')) {
      return 'briefing';
    }
    
    return 'general';
  }

  /**
   * Extract sections from markdown content
   * @param {string} content - Markdown content
   * @returns {Array<Section>} Extracted sections
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
   * @param {string} content - Section content
   * @returns {Array<string>} Key points
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

    // Extract pending tasks
    const pendingRegex = /^(?:[-*]\s+)?\[\s\]\s+(.+)$/gmi;
    while ((match = pendingRegex.exec(content)) !== null) {
      points.push(`⏳ ${match[1].trim()}`);
    }

    // Extract URLs/links
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    while ((match = urlRegex.exec(content)) !== null) {
      points.push(`🔗 ${match[1]}`);
    }

    return points.slice(0, 8); // Increased limit for more comprehensive capture
  }

  /**
   * Generate a summary for the memory file
   * @param {string} type - File type
   * @param {Array<Section>} sections - Extracted sections
   * @returns {string} Generated summary
   */
  generateSummary(type, sections) {
    const sectionTitles = sections.map(s => s.title).join(', ');
    
    switch (type) {
      case 'snapshot':
        return `System health monitoring: ${sectionTitles || 'General metrics'}`;
      case 'session':
        return `Work session: ${sectionTitles || 'Activity log'}`;
      case 'briefing':
        return `Daily intelligence briefing: ${sectionTitles || 'Updates and reports'}`;
      default:
        return `Activity log: ${sectionTitles || 'General notes'}`;
    }
  }

  /**
   * Extract timestamp from content
   * @param {string} content - File content
   * @returns {string|null} Extracted timestamp
   */
  extractTimestamp(content) {
    // Try ISO format first
    const isoRegex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/;
    let match = content.match(isoRegex);
    if (match) return match[1];
    
    // Try date format
    const dateRegex = /(\d{4}-\d{2}-\d{2})/;
    match = content.match(dateRegex);
    if (match) return match[1];
    
    return null;
  }

  /**
   * Get statistics about memory files for a date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Statistics object
   */
  async getStats(date) {
    const files = await this.scanDate(date);
    
    const stats = {
      totalFiles: files.length,
      byType: {},
      byDirectory: {},
      totalSections: 0,
      totalKeyPoints: 0,
      keyActivities: [],
      searchPaths: this.getSearchPaths()
    };

    for (const file of files) {
      // Count by type
      stats.byType[file.type] = (stats.byType[file.type] || 0) + 1;
      
      // Count by directory
      const dir = path.dirname(file.filepath);
      stats.byDirectory[dir] = (stats.byDirectory[dir] || 0) + 1;
      
      // Count sections and key points
      stats.totalSections += file.sections.length;
      
      // Collect key activities from all sections
      for (const section of file.sections) {
        stats.totalKeyPoints += section.keyPoints.length;
        stats.keyActivities.push(...section.keyPoints.slice(0, 2));
      }
    }

    // Deduplicate and limit key activities
    stats.keyActivities = [...new Set(stats.keyActivities)].slice(0, 15);
    
    return stats;
  }

  /**
   * Find all dates that have memory files
   * @returns {Promise<Array<string>>} Array of dates (YYYY-MM-DD)
   */
  async findAllDates() {
    const datePattern = /^(\d{4}-\d{2}-\d{2})/;
    const dates = new Set();
    const searchPaths = this.getSearchPaths();

    for (const basePath of searchPaths) {
      try {
        const scanRecursive = (currentPath) => {
          const entries = fs.readdirSync(currentPath, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            
            if (entry.isDirectory()) {
              scanRecursive(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
              const match = entry.name.match(datePattern);
              if (match) {
                dates.add(match[1]);
              }
            }
          }
        };
        
        scanRecursive(basePath);
      } catch (error) {
        console.warn(`[MemoryScanner] Error finding dates in ${basePath}:`, error.message);
      }
    }

    return Array.from(dates).sort();
  }
}

module.exports = { MemoryScanner };
