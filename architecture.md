# Notion Journal Skill - Architecture Design

**Version:** 1.0.0  
**Date:** 2026-02-19  
**Status:** Design Phase

---

## 1. Overview

### 1.1 Purpose

Notion Journal Skill 是一个用于在 Notion 中管理日记和日志的 OpenClaw Skill。它提供结构化的日记创建、查询、更新功能，支持模板系统、标签管理、情绪追踪等高级特性。

### 1.2 Target Users

- 使用 Notion 作为个人知识管理系统的用户
- 需要结构化日记记录功能的 OpenClaw 用户
- 希望自动化日记工作流程的开发者

### 1.3 Core Capabilities

| Capability | Description | Priority |
|------------|-------------|----------|
| Create Entry | 创建新的日记条目 | P0 |
| Query Entries | 查询历史日记 | P0 |
| Update Entry | 更新现有日记 | P0 |
| Template System | 支持多种日记模板 | P1 |
| Tag Management | 标签分类和检索 | P1 |
| Mood Tracking | 情绪追踪和统计 | P1 |
| Daily Digest | 每日摘要生成 | P2 |
| Weekly Summary | 周汇总报告 | P2 |

---

## 2. Directory Structure

```
notion-journal-skill/
├── SKILL.md                          # Skill 主文档 (必需)
├── package.json                      # Node.js 依赖配置
├── lib/
│   ├── index.js                      # 主入口，导出所有组件
│   ├── journal-core.js               # 核心日记操作类
│   ├── journal-templates.js          # 模板管理系统
│   ├── journal-queries.js            # 查询和过滤系统
│   ├── journal-tags.js               # 标签管理系统
│   ├── journal-mood.js               # 情绪追踪系统
│   ├── notion-adapter.js             # Notion API 适配层
│   └── config-manager.js             # 配置管理器
├── scripts/
│   ├── init-database.js              # 初始化日记数据库结构
│   ├── migrate-entries.js            # 日记条目迁移工具
│   └── generate-summary.js           # 摘要生成脚本
├── references/
│   ├── templates.md                  # 模板详细说明
│   ├── notion-blocks.md              # Notion 块类型参考
│   └── examples.md                   # 使用示例
├── assets/
│   └── templates/
│       ├── daily-template.json       # 每日日记模板
│       ├── weekly-template.json      # 每周回顾模板
│       └── mood-tracker-template.json # 情绪追踪模板
└── tests/
    ├── unit/
    │   ├── journal-core.test.js
    │   ├── journal-templates.test.js
│   │   └── notion-adapter.test.js
    └── integration/
        └── journal-workflow.test.js
```

---

## 3. Core API Design

### 3.1 Main Class: NotionJournal

```javascript
class NotionJournal {
  constructor(options)
  async initialize()
  async createEntry(entryData)
  async getEntry(entryId)
  async updateEntry(entryId, updates)
  async deleteEntry(entryId)
  async queryEntries(queryOptions)
  async getEntriesByDateRange(startDate, endDate)
  async getEntriesByTag(tag)
  async generateSummary(startDate, endDate)
  async getMoodStats(startDate, endDate)
}
```

### 3.2 Entry Data Structure

```javascript
// JournalEntry
{
  id: "string",                    // Notion page ID
  title: "string",                 // 日记标题
  date: "ISO8601",                 // 日记日期
  content: {
    blocks: [...],                 // Notion block 数组
    markdown: "string"             // Markdown 内容 (可选)
  },
  metadata: {
    mood: "string",                // 情绪: happy, neutral, sad, excited, anxious
    tags: ["string"],              // 标签数组
    weather: "string",             // 天气 (可选)
    location: "string",            // 位置 (可选)
    template: "string"             // 使用的模板
  },
  createdAt: "ISO8601",
  updatedAt: "ISO8601"
}
```

### 3.3 Public API Methods

#### 3.3.1 createEntry(entryData)

创建新的日记条目。

**Parameters:**
```javascript
{
  title: "string",                 // 必需
  date: "YYYY-MM-DD",              // 可选，默认为今天
  content: {
    blocks: [...],                 // Notion blocks
    or
    markdown: "string"             // Markdown 文本
  },
  template: "string",              // 可选，模板名称
  metadata: {
    mood: "string",
    tags: ["string"],
    ...
  }
}
```

**Returns:**
```javascript
{
  success: true,
  data: {
    id: "page-id",
    url: "notion-page-url",
    createdAt: "ISO8601"
  }
}
```

#### 3.3.2 getEntry(entryId)

获取单个日记条目详情。

**Parameters:**
- `entryId` (string): Notion page ID

**Returns:**
```javascript
{
  success: true,
  data: JournalEntry
}
```

#### 3.3.3 updateEntry(entryId, updates)

更新日记条目。

**Parameters:**
```javascript
entryId: "string"
updates: {
  title: "string",                 // 可选
  content: {...},                  // 可选
  metadata: {...}                  // 可选 (部分更新)
}
```

**Returns:**
```javascript
{
  success: true,
  data: {
    id: "page-id",
    updatedAt: "ISO8601"
  }
}
```

#### 3.3.4 deleteEntry(entryId)

删除日记条目 (软删除，归档处理)。

**Parameters:**
- `entryId` (string): Notion page ID

**Returns:**
```javascript
{
  success: true,
  data: { archived: true }
}
```

#### 3.3.5 queryEntries(queryOptions)

查询日记条目，支持多种过滤条件。

**Parameters:**
```javascript
{
  startDate: "YYYY-MM-DD",         // 可选
  endDate: "YYYY-MM-DD",           // 可选
  tags: ["string"],                // 可选，标签过滤
  mood: "string",                  // 可选，情绪过滤
  search: "string",                // 可选，全文搜索
  limit: number,                   // 可选，默认 50
  offset: number                   // 可选，默认 0
}
```

**Returns:**
```javascript
{
  success: true,
  data: {
    entries: [JournalEntry],
    total: number,
    hasMore: boolean
  }
}
```

#### 3.3.6 generateSummary(startDate, endDate)

生成指定日期范围的日记摘要。

**Parameters:**
- `startDate` (string): "YYYY-MM-DD"
- `endDate` (string): "YYYY-MM-DD"

**Returns:**
```javascript
{
  success: true,
  data: {
    period: { start: "...", end: "..." },
    entryCount: number,
    moodDistribution: {
      happy: 5,
      neutral: 2,
      sad: 1
    },
    topTags: ["string"],
    summary: "string"               // AI 生成的摘要
  }
}
```

---

## 4. Notion-MCP-Wrapper Integration

### 4.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  NotionJournal (Skill)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Journal    │  │   Journal    │  │   Journal    │      │
│  │    Core      │  │  Templates   │  │    Tags      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           │                                 │
│                  ┌────────▼────────┐                       │
│                  │  NotionAdapter  │                       │
│                  └────────┬────────┘                       │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              NotionMCPWrapper                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ HealthMonitor│  │  RetryPolicy │  │   Fallback   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Adapter Layer Design

`notion-adapter.js` 封装所有与 NotionMCPWrapper 的交互：

```javascript
class NotionAdapter {
  constructor(options)
  
  // Connection Management
  async connect()
  async disconnect()
  isConnected()
  
  // Database Operations
  async createDatabase(parentPageId, config)
  async getDatabase(databaseId)
  
  // Page Operations
  async createPage(parentId, properties, children)
  async getPage(pageId)
  async updatePage(pageId, properties)
  async archivePage(pageId)
  
  // Block Operations
  async appendBlocks(pageId, blocks)
  async getBlockChildren(blockId)
  
  // Query Operations
  async queryDatabase(databaseId, filter, sorts)
  async search(query)
}
```

### 4.3 Integration Points

| Skill Component | Wrapper Method | Fallback Support |
|----------------|----------------|------------------|
| createEntry | `execute('createPage', ...)` | ✅ Yes |
| getEntry | `execute('getPage', ...)` | ✅ Yes |
| updateEntry | `execute('updatePage', ...)` | ✅ Yes |
| deleteEntry | `execute('deletePage', ...)` | ✅ Yes |
| queryEntries | `execute('queryDatabase', ...)` | ❌ No (需直接 API) |
| appendBlocks | `execute('appendBlocks', ...)` | ❌ No |

### 4.4 Wrapper Configuration

```javascript
const wrapper = new NotionMCPWrapper({
  enableHealthMonitor: true,       // 启用健康监控
  enableRetry: true,               // 启用重试机制
  enableFallback: true,            // 启用降级策略
  retryOptions: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
  },
  healthOptions: {
    checkIntervalMs: 30000,        // 每30秒检查一次
    timeoutMs: 10000
  }
});
```

---

## 5. Error Handling Strategy

### 5.1 Error Types Hierarchy

```
NotionJournalError (base)
├── ConnectionError          # MCP 连接问题
├── AuthenticationError      # Token 无效或过期
├── NotFoundError           # 资源不存在
├── ValidationError         # 参数验证失败
├── RateLimitError          # API 限流
├── DatabaseError           # 数据库操作失败
└── TemplateError           # 模板处理错误
```

### 5.2 Error Handling Flow

```
User Request
    │
    ▼
┌──────────────┐
│  Validate    │ ──ValidationError──► Return 400
│   Input      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Execute    │ ──ConnectionError──► Retry → Fallback
│  Operation   │ ──RateLimitError───► Exponential Backoff
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Return     │
│   Result     │
└──────────────┘
```

### 5.3 Error Recovery Strategies

| Error Type | Recovery Strategy | Max Retries |
|------------|-------------------|-------------|
| ConnectionError | 自动重连 + 降级 | 3 |
| RateLimitError | 指数退避 | 5 |
| AuthenticationError | 立即失败，提示检查 Token | 0 |
| NotFoundError | 立即失败 | 0 |
| ValidationError | 立即失败 | 0 |

### 5.4 Error Response Format

```javascript
// 统一错误响应
{
  success: false,
  error: {
    type: "ConnectionError",
    code: "MCP_CONNECTION_FAILED",
    message: "Failed to connect to Notion MCP server",
    details: {
      originalError: "...",
      retryCount: 3,
      fallbackAttempted: true
    },
    suggestion: "Check your NOTION_TOKEN and network connection"
  }
}
```

---

## 6. Configuration Options

### 6.1 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NOTION_TOKEN` | ✅ | - | Notion Integration Token |
| `NOTION_API_KEY` | ❌ | - | 备选 API Key |
| `JOURNAL_DATABASE_ID` | ❌ | auto | 日记数据库 ID |
| `JOURNAL_PARENT_PAGE_ID` | ❌ | - | 父页面 ID (创建数据库用) |

### 6.2 Constructor Options

```javascript
const journal = new NotionJournal({
  // Notion 配置
  notion: {
    token: process.env.NOTION_TOKEN,
    databaseId: process.env.JOURNAL_DATABASE_ID,
    parentPageId: process.env.JOURNAL_PARENT_PAGE_ID
  },
  
  // MCP Wrapper 配置
  mcp: {
    enableHealthMonitor: true,
    enableRetry: true,
    enableFallback: true,
    retryOptions: {
      maxRetries: 3,
      baseDelayMs: 1000
    }
  },
  
  // 日记配置
  journal: {
    defaultTemplate: 'daily',
    dateFormat: 'YYYY-MM-DD',
    autoCreateDatabase: true,      // 数据库不存在时自动创建
    databaseName: 'My Journal'
  },
  
  // 模板配置
  templates: {
    directory: './assets/templates',
    customTemplates: [...]
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    ttl: 300000                    // 5分钟
  }
});
```

### 6.3 Database Schema

Notion 数据库属性配置：

| Property | Type | Description |
|----------|------|-------------|
| Title | title | 日记标题 |
| Date | date | 日记日期 |
| Mood | select | 情绪 (happy, neutral, sad, excited, anxious) |
| Tags | multi_select | 标签 |
| Weather | select | 天气 (可选) |
| Location | rich_text | 位置 (可选) |
| Template | select | 使用的模板 |
| Created At | created_time | 创建时间 |
| Updated At | last_edited_time | 更新时间 |

---

## 7. Template System

### 7.1 Template Structure

```javascript
// Template Definition
{
  name: "daily",
  description: "Daily journal template",
  properties: {
    mood: { default: "neutral" },
    tags: { default: ["daily"] }
  },
  blocks: [
    { type: "heading_1", text: "Daily Journal - {{date}}" },
    { type: "heading_2", text: "🌅 Morning" },
    { type: "paragraph", text: "..." },
    { type: "heading_2", text: "🌙 Evening Reflection" },
    { type: "to_do", text: "Gratitude item 1", checked: false },
    { type: "to_do", text: "Gratitude item 2", checked: false },
    { type: "heading_2", text: "💭 Notes" },
    { type: "paragraph", text: "" }
  ]
}
```

### 7.2 Built-in Templates

| Template | Description |
|----------|-------------|
| `daily` | 标准每日日记 |
| `weekly` | 每周回顾 |
| `minimal` | 极简日记 |
| `mood-tracker` | 情绪追踪专用 |
| `gratitude` | 感恩日记 |

---

## 8. Implementation Phases

### Phase 1: Core Foundation (P0)
- [ ] 项目初始化和依赖配置
- [ ] NotionAdapter 实现
- [ ] JournalCore 基础 CRUD
- [ ] 基本错误处理

### Phase 2: Template System (P1)
- [ ] 模板引擎实现
- [ ] 5个内置模板
- [ ] 模板自定义支持

### Phase 3: Advanced Features (P1)
- [ ] 标签管理系统
- [ ] 情绪追踪
- [ ] 查询和过滤

### Phase 4: Analytics (P2)
- [ ] 摘要生成
- [ ] 情绪统计
- [ ] 导出功能

### Phase 5: Polish (P2)
- [ ] 完整测试覆盖
- [ ] 文档完善
- [ ] CLI 工具

---

## 9. Dependencies

### 9.1 Runtime Dependencies

```json
{
  "dependencies": {
    "notion-mcp-wrapper": "^2.0.0",
    "date-fns": "^3.0.0",
    "handlebars": "^4.7.0"
  }
}
```

### 9.2 Dev Dependencies

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^8.0.0"
  }
}
```

---

## 10. Appendix

### 10.1 Notion Block Types Supported

| Block Type | Support Status |
|------------|----------------|
| paragraph | ✅ Full |
| heading_1/2/3 | ✅ Full |
| bulleted_list_item | ✅ Full |
| numbered_list_item | ✅ Full |
| to_do | ✅ Full |
| quote | ✅ Full |
| code | ✅ Full |
| divider | ✅ Full |
| image | ⚠️ URL only |
| table | ⚠️ Basic |

### 10.2 Migration Path

从直接使用 Notion API 迁移到本 Skill:

```javascript
// Before: Direct API
const notion = new Client({ auth: token });
const page = await notion.pages.create({...});

// After: Using Skill
const journal = new NotionJournal({ token });
const result = await journal.createEntry({...});
```

---

**End of Document**
