/**
 * ContentAggregator - Aggregate memory content into Journal format
 * v1.1.0 - Generate comprehensive Journal content
 */

class ContentAggregator {
  constructor(options = {}) {
    this.style = options.style || 'lively'; // 'lively' | 'minimal' | 'formal'
  }

  /**
   * Aggregate memory files into Journal content
   * @param {Array<MemoryFile>} memoryFiles - Parsed memory files
   * @param {string} date - Date string YYYY-MM-DD
   * @returns {JournalContent} Generated journal content
   */
  aggregate(memoryFiles, date) {
    if (!memoryFiles || memoryFiles.length === 0) {
      return this.generateEmptyTemplate(date);
    }

    const blocks = [];
    
    // 1. Header
    blocks.push(...this.generateHeader(date));
    
    // 2. Group files by type and generate sections
    const grouped = this.groupByType(memoryFiles);
    
    // System Snapshots
    if (grouped.snapshot && grouped.snapshot.length > 0) {
      blocks.push(...this.generateSnapshotSection(grouped.snapshot));
    }
    
    // Sessions
    if (grouped.session && grouped.session.length > 0) {
      blocks.push(...this.generateSessionSection(grouped.session));
    }
    
    // Briefings
    if (grouped.briefing && grouped.briefing.length > 0) {
      blocks.push(...this.generateBriefingSection(grouped.briefing));
    }
    
    // Other activities
    if (grouped.general && grouped.general.length > 0) {
      blocks.push(...this.generateGeneralSection(grouped.general));
    }
    
    // 3. Today's Feelings
    blocks.push(...this.generateFeelingsSection(memoryFiles));

    // 4. Generate summary
    const summary = this.generateSummary(memoryFiles);
    const mood = this.detectMood(memoryFiles);

    return {
      blocks,
      summary,
      mood
    };
  }

  /**
   * Generate header blocks
   */
  generateHeader(date) {
    const dateObj = new Date(date);
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    
    const quotes = [
      "每一天都是新的开始。🌅",
      "记录是为了更好地回忆。📝",
      "进步来自每一天的积累。📈",
      "保持好奇，保持记录。🔍",
      "今天的努力，明天的收获。💪"
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    return [
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: `📓 Journal Entry — ${date}` } }]
        }
      },
      {
        type: 'quote',
        quote: {
          rich_text: [{ text: { content: `${quote}` } }]
        }
      }
    ];
  }

  /**
   * Group memory files by type
   */
  groupByType(files) {
    const grouped = {};
    for (const file of files) {
      if (!grouped[file.type]) {
        grouped[file.type] = [];
      }
      grouped[file.type].push(file);
    }
    return grouped;
  }

  /**
   * Generate system snapshot section
   */
  generateSnapshotSection(snapshots) {
    const blocks = [];
    
    blocks.push({
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '📊 系统监控' } }]
      }
    });

    for (const snapshot of snapshots.slice(0, 2)) {
      const uptimeMatch = snapshot.raw.match(/Uptime:\s*([\d\w\s]+)/);
      const loadMatch = snapshot.raw.match(/Load Average:\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
      const memoryMatch = snapshot.raw.match(/Memory:\s*([\d.]+)\s*GB.*\(([\d.]+)%/);

      if (uptimeMatch || loadMatch || memoryMatch) {
        const details = [];
        if (uptimeMatch) details.push(`⏱️ Uptime: ${uptimeMatch[1].trim()}`);
        if (loadMatch) details.push(`📈 Load: ${loadMatch[1]}/${loadMatch[2]}/${loadMatch[3]}`);
        if (memoryMatch) details.push(`💾 Memory: ${memoryMatch[2]}%`);

        if (details.length > 0) {
          blocks.push({
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ text: { content: details.join(' | ') } }]
            }
          });
        }
      }
    }

    blocks.push({ type: 'divider', divider: {} });
    return blocks;
  }

  /**
   * Generate session section
   */
  generateSessionSection(sessions) {
    const blocks = [];
    
    const sessionEmoji = ['🚀', '💡', '🔧', '📚', '🎯'];
    let emojiIndex = 0;

    for (const session of sessions.slice(0, 3)) {
      const title = session.sections[0]?.title || 'Work Session';
      const keyPoints = session.sections.flatMap(s => s.keyPoints).slice(0, 3);
      
      blocks.push({
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: `${sessionEmoji[emojiIndex % sessionEmoji.length]} ${title}` } }]
        }
      });

      for (const point of keyPoints) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: point.substring(0, 100) } }]
          }
        });
      }

      emojiIndex++;
    }

    blocks.push({ type: 'divider', divider: {} });
    return blocks;
  }

  /**
   * Generate briefing section
   */
  generateBriefingSection(briefings) {
    const blocks = [];
    
    blocks.push({
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '📰 情报简报' } }]
      }
    });

    for (const briefing of briefings.slice(0, 1)) {
      // Extract hot topics or key metrics
      const hotMatch = briefing.raw.match(/🔥\s*Hot[^|]+\|\s*([^|]+)\|/);
      if (hotMatch) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `🔥 ${hotMatch[1].trim().substring(0, 80)}` } }]
          }
        });
      }

      // Extract community highlights
      const communityMatch = briefing.raw.match(/🦞\s*([^\n]+)/);
      if (communityMatch) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `🦞 ${communityMatch[1].trim().substring(0, 80)}` } }]
          }
        });
      }
    }

    blocks.push({ type: 'divider', divider: {} });
    return blocks;
  }

  /**
   * Generate general activities section
   */
  generateGeneralSection(general) {
    const blocks = [];
    
    blocks.push({
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '📝 其他活动' } }]
      }
    });

    const allPoints = general.flatMap(g => g.sections.flatMap(s => s.keyPoints));
    const uniquePoints = [...new Set(allPoints)].slice(0, 5);

    for (const point of uniquePoints) {
      blocks.push({
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ text: { content: point.substring(0, 100) } }]
        }
      });
    }

    blocks.push({ type: 'divider', divider: {} });
    return blocks;
  }

  /**
   * Generate feelings section
   */
  generateFeelingsSection(files) {
    const blocks = [];
    
    blocks.push({
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '🌟 今日感受' } }]
      }
    });

    const feelings = this.detectMood(files);
    const feelingEmojis = {
      'Productive': '🚀',
      'Focused': '🎯',
      'Creative': '💡',
      'Relaxed': '😌',
      'Energetic': '⚡',
      'Calm': '🧘',
      'Learning': '📚',
      'Collaborative': '🤝'
    };

    for (const feeling of feelings.slice(0, 3)) {
      const emoji = feelingEmojis[feeling] || '✨';
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { text: { content: `${emoji} ${feeling} ` }, annotations: { bold: true } },
            { text: { content: '— 基于今日活动分析' } }
          ]
        }
      });
    }

    blocks.push({
      type: 'paragraph',
      paragraph: {
        rich_text: [{ 
          text: { content: 'Another day, another story. 🜁' }, 
          annotations: { italic: true, color: 'gray' } 
        }]
      }
    });

    return blocks;
  }

  /**
   * Generate concise summary
   */
  generateSummary(files) {
    const byType = {};
    for (const file of files) {
      byType[file.type] = (byType[file.type] || 0) + 1;
    }

    const parts = [];
    if (byType.session) parts.push(`${byType.session}个工作会话`);
    if (byType.snapshot) parts.push(`${byType.snapshot}次系统监控`);
    if (byType.briefing) parts.push(`${byType.briefing}份情报简报`);

    if (parts.length === 0) {
      return '记录日常活动';
    }

    return `今日${parts.join('，')}`;
  }

  /**
   * Detect mood from files
   */
  detectMood(files) {
    const moodKeywords = {
      'Productive': ['完成', '✅', 'deploy', '发布', 'success'],
      'Focused': ['deep work', '专注', 'session', 'debug'],
      'Creative': ['design', 'create', 'build', '开发'],
      'Learning': ['research', '调研', '学习', '研究'],
      'Collaborative': ['team', 'discuss', '会议', '协作'],
      'Relaxed': ['rest', 'break', 'pause', '休息']
    };

    const scores = {};
    const content = files.map(f => f.raw).join(' ').toLowerCase();

    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      scores[mood] = keywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        const matches = content.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);
    }

    // Sort by score and return top 3
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, score]) => score > 0)
      .slice(0, 3)
      .map(([mood]) => mood);
  }

  /**
   * Generate empty template
   */
  generateEmptyTemplate(date) {
    return {
      blocks: [
        {
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: `📓 Journal Entry — ${date}` } }]
          }
        },
        {
          type: 'quote',
          quote: {
            rich_text: [{ text: { content: '每一天都是新的开始。🌅' } }]
          }
        },
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: '今日暂无详细记录，但每一个平静的日子都值得感恩。' } }]
          }
        }
      ],
      summary: '平静的一天',
      mood: ['Calm']
    };
  }
}

module.exports = { ContentAggregator };
