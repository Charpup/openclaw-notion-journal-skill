# SKILL.md - Notion Journal Skill

---
name: notion-journal
description: Production-ready Notion Journal management skill with automated entry creation, comprehensive memory scanning, smart content aggregation, intelligent backfilling, and duplicate detection.
version: "1.1.0"
author: Galatea
license: MIT
---

# Notion Journal Skill 📝

**Version:** 1.1.0 | **Author:** Galatea

A production-ready skill for managing daily journals in Notion, with automatic content generation from memory files, comprehensive memory scanning, intelligent backfilling, and robust error handling.

## What's New in v1.1.0

### 🆕 Comprehensive Memory Scanning

The skill now supports **comprehensive mode** that scans **all** memory files for a date:

- **System Snapshots** - Health metrics, uptime, load averages
- **Session Records** - Work sessions, project activities  
- **Daily Briefings** - Moltbook, EvoMap, and other reports
- **General Activity** - Any other memory files

### 🆕 Smart Content Aggregation

Automatically generates structured Journal content:
- 📊 System monitoring section
- 🚀 Work session summaries  
- 📰 Intelligence briefing highlights
- 🌟 Auto-detected mood tags
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
- 📓 Header with daily quote
- 📊 System monitoring (snapshots)
- 🚀 Work sessions
- 📰 Briefing highlights
- 📝 Other activities
- 🌟 Today's feelings

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
| NOTION_TOKEN | ✅ | Notion Integration Token |
| JOURNAL_DATABASE_ID | ✅ | Database ID |

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

- @notionhq/client
- @tryfabric/martian

## License

MIT
