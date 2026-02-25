---
name: notion-journal
description: Automate daily Notion journal entries with comprehensive memory scanning, content aggregation from session/snapshot/briefing files, intelligent backfilling, and duplicate detection. Use when creating journal entries, backfilling missing dates, or generating journal content from memory files. Triggers on "notion journal", "daily journal", "backfill journal", "create journal entry".
version: "1.2.0"
author: Galatea
license: MIT
---

# Notion Journal Skill

**Version:** 1.2.0 | **Author:** Galatea

A production-ready skill for managing daily journals in Notion, with automatic content generation from memory files, comprehensive memory scanning, intelligent backfilling, and robust error handling.

## What's New in v1.2.0

- Added Notion Skill Ecosystem cross-references (see bottom of this file)
- Fixed SKILL.md frontmatter position (must be at file start for correct loading)

## What's New in v1.1.0

### Comprehensive Memory Scanning

The skill now supports **comprehensive mode** that scans **all** memory files for a date:

- **System Snapshots** - Health metrics, uptime, load averages
- **Session Records** - Work sessions, project activities
- **Daily Briefings** - Moltbook, EvoMap, and other reports
- **General Activity** - Any other memory files

### Smart Content Aggregation

Automatically generates structured Journal content:
- System monitoring section
- Work session summaries
- Intelligence briefing highlights
- Auto-detected mood tags
- Formatted Notion blocks

## When to Use

**Use this skill when:**
- Creating daily journal entries in Notion
- Backfilling missing journal dates
- Generating journal content from memory files
- **Scanning comprehensive memory sources (v1.1.0)**
- Checking for and merging duplicate entries
- Managing journal templates and moods

## Quick Start

```javascript
const { NotionJournal } = require('./lib');

// Initialize
const journal = new NotionJournal({
  token: process.env.NOTION_TOKEN,
  databaseId: 'bba17595-6733-4088-bc4a-57dc9f7af899'
});

// Create today's entry (comprehensive mode v1.1.0)
const result = await journal.createEntry({
  title: '2026-02-20',
  comprehensive: true  // Enable comprehensive scanning
});

// Backfill missing dates (uses comprehensive mode by default)
const backfill = await journal.backfillMissingDates(7);
```

## Core Functions

### createEntry(entryData)

Create a new journal entry.

**Parameters:**
```javascript
{
  title: "2026-02-20",           // Required: date string
  date: "2026-02-20",            // Optional: defaults to title
  content: { blocks: [...] },    // Optional: custom content
  template: "daily",             // Optional: template name
  comprehensive: true,           // Optional: v1.1.0 - scan all memory files
  metadata: {
    mood: ["Focused"],           // Optional: mood tags
    summary: "Today was..."      // Optional: summary text
  }
}
```

**Returns:**
```javascript
{
  success: true,
  data: {
    id: "page-id",
    url: "https://notion.so/...",
    createdAt: "2026-02-20T...",
    existed: false  // true if entry already existed
  }
}
```

### generateContent(date)

Generate journal content from memory files (legacy mode).

**Parameters:** `date` (string, "YYYY-MM-DD")

**Returns:**
```javascript
{
  blocks: [...],      // Notion block array
  summary: "...",     // Generated summary
  mood: ["Focused"],  // Detected moods
  activityCount: 5
}
```

### generateComprehensiveContent(date) - v1.1.0

Generate comprehensive journal content from **all** memory files.

**Parameters:** `date` (string, "YYYY-MM-DD")

**Returns:**
```javascript
{
  blocks: [...],           // Notion block array (structured)
  summary: "...",          // Aggregated summary
  mood: ["Productive"],    // Detected moods
  activityCount: 15,       // Total activities
  memoryFiles: 4           // Number of files scanned
}
```

**Generated Structure:**
- Header with daily quote
- System monitoring (snapshots)
- Work sessions
- Briefing highlights
- Other activities
- Today's feelings

### backfillMissingDates(days)

Create entries for dates without journals.

**Parameters:** `days` (number, default: 30)

**Returns:**
```javascript
{
  success: true,
  data: {
    scanned: 30,
    missing: 3,
    created: 3,
    entries: [...]
  }
}
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| NOTION_TOKEN | Yes | Notion Integration Token |
| JOURNAL_DATABASE_ID | Yes | Database ID |

### Constructor Options

```javascript
const journal = new NotionJournal({
  token: "your-token",           // Or use env var
  databaseId: "database-id",     // Or use env var
  memoryPath: "/path/to/memory"  // Optional, default: /root/.openclaw/workspace/memory
});
```

## Memory Scanning (v1.1.0)

The skill scans for files matching pattern: `memory/YYYY-MM-DD*.md`

### Supported File Types

| Type | Pattern | Content |
|------|---------|---------|
| Snapshot | `*-snapshot.md` or contains "System Snapshot" | System metrics |
| Session | `*-session.md` or contains "## Session" | Work sessions |
| Briefing | `*-briefing.md` or contains "Briefing" | Daily reports |
| General | `*.md` | Any other content |

### MemoryScanner API

```javascript
const { MemoryScanner } = require('./lib');

const scanner = new MemoryScanner();

// Scan all files for a date
const files = await scanner.scanDate('2026-02-24');
// Returns: [{ filename, type, sections, summary, ... }]

// Get statistics
const stats = await scanner.getStats('2026-02-24');
// Returns: { totalFiles, byType, totalSections, keyActivities }
```

### ContentAggregator API

```javascript
const { ContentAggregator } = require('./lib');

const aggregator = new ContentAggregator({ style: 'lively' });

// Aggregate memory files into Journal content
const content = aggregator.aggregate(memoryFiles, '2026-02-24');
// Returns: { blocks, summary, mood }
```

## Error Handling

All functions return standardized error responses:

```javascript
{
  success: false,
  error: {
    type: "NotFoundError",
    code: "NJ_NF_001",
    message: "...",
    suggestion: "Check database ID"
  }
}
```

## Templates

Built-in templates:
- `daily` - Standard daily journal
- `minimal` - Minimal template

## Dependencies

- `@notionhq/client` — Directly uses Notion's official SDK rather than notion-mcp-wrapper. This is a deliberate choice: journal automation is standalone and benefits from direct, low-latency API access without the overhead of MCP connection management.
- `@tryfabric/martian`

## Notion Skill Ecosystem

OpenClaw Notion skills 形成互补生态，可单独使用或组合使用：

| Skill | 职责 | 适用场景 |
|-------|------|---------|
| **notion-mcp-wrapper** | 弹性连接层：健康监控、自动重连、REST API 降级 | 任何需要高可用 Notion API 访问的场景 |
| **notion-md-converter** | 格式转换：Markdown → Notion blocks | 批量导入文档、从 Markdown 源创建 Notion 页面 |
| **notion-journal-skill** (本 skill) | 日记自动化：内存扫描、内容聚合、按日期创建条目 | 自动生成每日工作日志 |

**组合示例**：
- Markdown 日记导入：`notion-md-converter` 转换 Markdown 内容 → `notion-journal-skill` 聚合到日记条目
- 全面日记生成：内存扫描 (`generateComprehensiveContent`) → 自动创建当日 Notion 条目

## License

MIT
