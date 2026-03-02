/**
 * SubagentOrchestrator - Coordinate subagents for parallel journal processing
 * v2.0.0 - Introduces subagent-based architecture for scalable memory processing
 */

const { spawnSubagent } = require('./subagent-spawner');

class SubagentOrchestrator {
  constructor(options = {}) {
    this.memoryPaths = options.memoryPaths || [
      '/root/.openclaw/workspace/memory',
      '/root/.openclaw/memory'
    ];
    this.maxConcurrentSubagents = options.maxConcurrentSubagents || 4;
    this.timeoutMs = options.timeoutMs || 120000; // 2 minutes
  }

  /**
   * Execute the full journal generation pipeline using subagents
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<JournalContent>} Generated journal content
   */
  async generateJournal(date) {
    const startTime = Date.now();
    console.log(`[SubagentOrchestrator] Starting journal generation for ${date}`);

    try {
      // Phase 1: Subagent A - Scan all memory directories
      console.log('[Phase 1] Launching MemoryScanner subagent...');
      const scanResult = await this.executeSubagentA(date);
      
      if (!scanResult.files || scanResult.files.length === 0) {
        console.log('[SubagentOrchestrator] No memory files found, returning empty template');
        return this.generateEmptyTemplate(date);
      }

      // Phase 2: Subagent B - Read and categorize content
      console.log(`[Phase 2] Launching ContentReader subagent for ${scanResult.files.length} files...`);
      const categorizedResult = await this.executeSubagentB(scanResult.files, date);

      // Phase 3: Subagent C - Generate journal structure
      console.log('[Phase 3] Launching JournalGenerator subagent...');
      const journalStructure = await this.executeSubagentC(categorizedResult, date);

      // Phase 4: Subagent D - Prepare Notion blocks
      console.log('[Phase 4] Launching NotionFormatter subagent...');
      const notionContent = await this.executeSubagentD(journalStructure, date);

      const duration = Date.now() - startTime;
      console.log(`[SubagentOrchestrator] Completed in ${duration}ms`);

      return {
        blocks: notionContent.blocks,
        summary: journalStructure.summary,
        mood: journalStructure.mood,
        activityCount: categorizedResult.totalActivities || 0,
        memoryFiles: scanResult.files.length,
        processingTime: duration,
        subagentResults: {
          scanner: scanResult.stats,
          reader: categorizedResult.stats,
          generator: journalStructure.stats,
          formatter: notionContent.stats
        }
      };

    } catch (error) {
      console.error('[SubagentOrchestrator] Pipeline error:', error);
      // Fallback to local processing
      return this.fallbackToLocal(date);
    }
  }

  /**
   * Subagent A: Memory Directory Scanner
   * Scans all configured memory directories for files matching the date pattern
   */
  async executeSubagentA(date) {
    const task = {
      name: 'MemoryScanner',
      description: `Scan all memory directories for files matching ${date} pattern`,
      instructions: `
You are Subagent A - Memory Directory Scanner.

TASK: Scan all memory directories for files matching pattern: ${date}*.md

SEARCH PATHS (check ALL of these):
1. /root/.openclaw/workspace/memory/
2. /root/.openclaw/memory/
3. Any subdirectories within the above paths

REQUIREMENTS:
- Use find command or recursive directory traversal
- Match files: YYYY-MM-DD*.md pattern
- Collect: filename, full path, file size, modification time
- Return files sorted by modification time (oldest first)

OUTPUT FORMAT (JSON):
{
  "files": [
    {
      "filename": "2026-02-20-session.md",
      "filepath": "/root/.openclaw/workspace/memory/2026-02-20-session.md",
      "size": 1234,
      "mtime": "2026-02-20T10:30:00Z"
    }
  ],
  "stats": {
    "totalFiles": 5,
    "searchPaths": ["path1", "path2"],
    "searchTimeMs": 150
  }
}

IMPORTANT: Search thoroughly - check subdirectories too!
`,
      timeout: 30000,
      context: { date, memoryPaths: this.memoryPaths }
    };

    return await spawnSubagent(task);
  }

  /**
   * Subagent B: Content Reader & Categorizer
   * Reads file contents and categorizes by type
   */
  async executeSubagentB(files, date) {
    const task = {
      name: 'ContentReader',
      description: `Read and categorize ${files.length} memory files`,
      instructions: `
You are Subagent B - Content Reader & Categorizer.

TASK: Read all provided memory files and categorize their content.

FILES TO PROCESS:
${JSON.stringify(files.map(f => f.filepath || f), null, 2)}

CATEGORIZATION RULES:
1. **snapshot** - Contains "System Snapshot", uptime, load averages, health metrics
2. **session** - Contains "## Session", work activities, task lists
3. **briefing** - Contains "Moltbook", "EvoMap", "Briefing", daily reports
4. **general** - Any other content type

FOR EACH FILE:
- Read full content
- Detect type (snapshot/session/briefing/general)
- Extract key sections (## headings)
- Extract key points (bullet items, completed tasks, URLs)
- Generate 1-sentence summary

OUTPUT FORMAT (JSON):
{
  "categorized": {
    "snapshot": [{ "filename": "...", "summary": "...", "sections": [...] }],
    "session": [...],
    "briefing": [...],
    "general": [...]
  },
  "totalActivities": 15,
  "stats": {
    "filesRead": 5,
    "byType": { "snapshot": 1, "session": 2, "briefing": 1, "general": 1 },
    "processingTimeMs": 500
  }
}

IMPORTANT: Extract meaningful content, not just metadata!
`,
      timeout: 60000,
      context: { files, date }
    };

    return await spawnSubagent(task);
  }

  /**
   * Subagent C: Journal Structure Generator
   * Generates the narrative structure and content
   */
  async executeSubagentC(categorizedData, date) {
    const task = {
      name: 'JournalGenerator',
      description: 'Generate journal narrative structure from categorized content',
      instructions: `
You are Subagent C - Journal Structure Generator.

TASK: Create a compelling journal narrative from categorized memory data.

INPUT DATA:
${JSON.stringify(categorizedData.categorized || categorizedData, null, 2)}

GENERATE:
1. **Literary Header** - A poetic quote appropriate for the day's mood
2. **System Monitoring Section** - Summarize snapshot data
3. **Work Sessions Narrative** - Create flowing narrative from session data
4. **Briefing Highlights** - Key intelligence from briefings
5. **Other Activities** - Notable items from general files
6. **Personal Reflection** - "今夜絮语" section with emotional insight
7. **Mood Detection** - Array of mood tags based on content analysis
8. **Daily Summary** - 1-2 sentence summary of the day

NARRATIVE STYLE:
- Use literary, reflective tone
- Connect activities into coherent story
- Include emotional depth and personal voice
- Reference specific accomplishments and challenges

OUTPUT FORMAT (JSON):
{
  "structure": {
    "header": { "quote": "...", "mood": "..." },
    "sections": [
      { "type": "system", "title": "系统监控", "content": "..." },
      { "type": "sessions", "title": "今日行迹", "narrative": "...", "items": [...] },
      { "type": "briefings", "title": "情报简报", "highlights": [...] },
      { "type": "general", "title": "其他活动", "items": [...] },
      { "type": "reflection", "title": "今夜絮语", "content": "..." }
    ]
  },
  "summary": "今日完成了3个工作会话，处理了系统监控任务...",
  "mood": ["Productive", "Focused", "Reflective"],
  "stats": {
    "sectionsGenerated": 5,
    "wordCount": 450,
    "processingTimeMs": 800
  }
}

IMPORTANT: Create genuine narrative flow, not just bullet points!
`,
      timeout: 60000,
      context: { categorizedData, date }
    };

    return await spawnSubagent(task);
  }

  /**
   * Subagent D: Notion Block Formatter
   * Converts journal structure to Notion-compatible blocks
   */
  async executeSubagentD(journalStructure, date) {
    const task = {
      name: 'NotionFormatter',
      description: 'Format journal structure as Notion blocks',
      instructions: `
You are Subagent D - Notion Block Formatter.

TASK: Convert journal structure into Notion-compatible block format.

INPUT STRUCTURE:
${JSON.stringify(journalStructure.structure || journalStructure, null, 2)}

NOTION BLOCK TYPES TO USE:
- heading_1: Main title
- heading_2: Section headers
- heading_3: Subsection headers
- paragraph: Narrative text
- bulleted_list_item: List items
- quote: Literary quotes
- divider: Section separators

BLOCK FORMAT:
{
  "type": "paragraph",
  "paragraph": {
    "rich_text": [
      { "text": { "content": "Text here" }, "annotations": { "italic": true } }
    ]
  }
}

EMOJI MAPPING:
- 📓 Journal Entry — {date}
- 📊 系统监控
- 🌅 今日行迹
- 📰 情报简报
- 📝 其他活动
- 🌙 今夜絮语

OUTPUT FORMAT (JSON):
{
  "blocks": [
    { "object": "block", "type": "heading_1", "heading_1": { "rich_text": [...] } },
    ...
  ],
  "stats": {
    "blockCount": 25,
    "maxDepth": 3,
    "processingTimeMs": 200
  }
}

IMPORTANT: Ensure all blocks are valid Notion API format!
`,
      timeout: 30000,
      context: { journalStructure, date }
    };

    return await spawnSubagent(task);
  }

  /**
   * Fallback to local processing if subagents fail
   */
  async fallbackToLocal(date) {
    console.log('[SubagentOrchestrator] Falling back to local processing...');
    
    // Import local implementations
    const { MemoryScanner } = require('./memory-scanner');
    const { ContentAggregator } = require('./content-aggregator');
    
    const scanner = new MemoryScanner({ 
      memoryPaths: this.memoryPaths 
    });
    const aggregator = new ContentAggregator({ style: 'lively' });
    
    const memoryFiles = await scanner.scanDate(date);
    const aggregated = aggregator.aggregate(memoryFiles, date);
    
    return {
      blocks: aggregated.blocks.map(b => ({ object: 'block', ...b })),
      summary: aggregated.summary,
      mood: aggregated.mood,
      activityCount: memoryFiles.reduce((sum, f) => sum + (f.sections?.length || 0), 0),
      memoryFiles: memoryFiles.length,
      fallback: true
    };
  }

  /**
   * Generate empty template for dates with no memory files
   */
  generateEmptyTemplate(date) {
    return {
      blocks: [
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: `📓 Journal Entry — ${date}` } }]
          }
        },
        {
          object: 'block',
          type: 'quote',
          quote: {
            rich_text: [{ 
              text: { content: '每一个清晨都是宇宙写给我们的情书。' },
              annotations: { italic: true }
            }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ 
              text: { content: '今日暂无详细记录，但每一个平静的日子都值得感恩。' },
              annotations: { italic: true, color: 'gray' }
            }]
          }
        }
      ],
      summary: '平静的一天',
      mood: ['Calm'],
      activityCount: 0,
      memoryFiles: 0
    };
  }
}

module.exports = { SubagentOrchestrator };
