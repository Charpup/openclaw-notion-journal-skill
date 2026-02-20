# Notion Journal Skill

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Charpup/openclaw-notion-journal-skill/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-skill-purple.svg)](https://openclaw.ai)

Production-ready Notion Journal management skill for OpenClaw with automated content generation, intelligent backfilling, and robust error handling.

## 🚀 Features

- **Automated Entry Creation** - Create journal entries with one call
- **Content Generation** - Auto-generate content from memory files
- **Intelligent Backfill** - Find and create missing journal dates
- **Duplicate Detection** - Prevent duplicate entries
- **Mood Detection** - Automatically detect mood from content
- **Error Recovery** - Built-in retry and fallback strategies

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/Charpup/openclaw-notion-journal-skill.git
cd openclaw-notion-journal-skill

# Install dependencies
npm install
```

## 🔧 Configuration

### Environment Variables

```bash
export NOTION_TOKEN="your-notion-integration-token"
export JOURNAL_DATABASE_ID="your-database-id"
```

### Setup Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy the token
4. Share your journal database with the integration

## 📖 Usage

### Basic Usage

```javascript
const { NotionJournal } = require('./lib');

// Initialize
const journal = new NotionJournal();

// Create today's entry
const result = await journal.createEntry({
  title: '2026-02-20'
});

console.log(result.data.url);
```

### Backfill Missing Dates

```javascript
// Create entries for last 7 days
const backfill = await journal.backfillMissingDates(7);

console.log(`Created ${backfill.data.created} entries`);
```

### Generate Content

```javascript
const content = await journal.generateContent('2026-02-20');

console.log(content.summary);
console.log(content.mood); // ['Focused', 'Productive']
```

## 🏗️ Architecture

```
notion-journal-skill/
├── lib/
│   ├── index.js           # Main entry
│   ├── journal-core.js    # Core functionality
│   └── notion-adapter.js  # Notion API adapter
├── scripts/
│   └── release.sh         # Release helper
├── tests/
│   └── unit/              # Test suite
├── SKILL.md               # Skill documentation
├── SPEC.yaml              # Specification
└── package.json
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 API Reference

### NotionJournal

#### createEntry(entryData)
Create a new journal entry.

**Parameters:**
- `title` (string, required): Date in YYYY-MM-DD format
- `content` (object, optional): Custom Notion blocks
- `metadata.mood` (array, optional): Mood tags
- `metadata.summary` (string, optional): Entry summary

#### generateContent(date)
Generate content from memory files.

**Parameters:**
- `date` (string): Date in YYYY-MM-DD format

**Returns:** `{ blocks, summary, mood, activityCount }`

#### backfillMissingDates(days)
Create entries for missing dates.

**Parameters:**
- `days` (number): Number of days to scan (default: 30)

**Returns:** `{ scanned, missing, created, entries }`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Credits

- Built with [OpenClaw](https://openclaw.ai)
- Powered by [Notion API](https://developers.notion.com)

---

**Made with 🜁 by Galatea**
