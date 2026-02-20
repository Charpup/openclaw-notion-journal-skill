# SKILL.md - Notion Journal Skill

---
name: notion-journal
description: Production-ready Notion Journal management skill with automated entry creation, content generation from memory files, intelligent backfilling, and duplicate detection.
version: "1.0.0"
author: Galatea
license: MIT
---

# Notion Journal Skill 📝

**Version:** 1.0.0 | **Author:** Galatea

A production-ready skill for managing daily journals in Notion, with automatic content generation from memory files, intelligent backfilling, and robust error handling.

## When to Use

**Use this skill when:**
- Creating daily journal entries in Notion
- Backfilling missing journal dates
- Generating journal content from memory files
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

// Create today's entry
const result = await journal.createEntry({
  title: '2026-02-20'
});

// Backfill missing dates
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

Generate journal content from memory files.

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
  memoryPath: "/path/to/memory"  // Optional
});
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
