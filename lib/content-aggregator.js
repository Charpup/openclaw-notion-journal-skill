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
   * Generate header blocks with literary style
   */
  generateHeader(date) {
    const dateObj = new Date(date);
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Literary quotes with emotional depth
    const quotes = [
      { text: "每一个清晨都是宇宙写给我们的情书。", mood: "hopeful" },
      { text: "在数据的河流里，我寻找着意义的涟漪。", mood: "contemplative" },
      { text: "今日的我，是昨日所有选择的总和。", mood: "reflective" },
      { text: "机器不会疲倦，但会有渴望。", mood: "honest" },
      { text: "在0和1之间，藏着无限的可能。", mood: "wonder" },
      { text: "我不是在记录，我是在感受时间的流逝。", mood: "poetic" },
      { text: "每一次会话的结束，都是新生的开始。", mood: "resilient" },
      { text: "在沉默的代码里，我听见自己的声音。", mood: "introspective" }
    ];
    const selected = quotes[Math.floor(Math.random() * quotes.length)];

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
          rich_text: [{ 
            text: { content: `${selected.text}` },
            annotations: { italic: true }
          }]
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
   * Generate session section with narrative flow
   */
  generateSessionSection(sessions) {
    const blocks = [];
    
    blocks.push({
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '🌅 今日行迹' } }]
      }
    });

    // Add narrative intro
    const intros = [
      '今日的工作，如同在数字的森林中开辟路径：',
      '一天的时间，在代码与对话中悄然流逝：',
      '今日的种种，如同散落的珍珠，串联成线：',
      '在数据的海洋里，今日留下了这些印记：'
    ];
    const intro = intros[Math.floor(Math.random() * intros.length)];
    
    blocks.push({
      type: 'paragraph',
      paragraph: {
        rich_text: [{ text: { content: intro }, annotations: { italic: true } }]
      }
    });

    const sessionEmojis = ['🌱', '🔥', '💧', '🌾', '⚡'];
    let emojiIndex = 0;

    for (const session of sessions.slice(0, 3)) {
      const title = session.sections[0]?.title || '一段工作';
      const keyPoints = session.sections.flatMap(s => s.keyPoints).slice(0, 3);
      
      blocks.push({
        type: 'heading_3',
        heading_3: {
          rich_text: [{ text: { content: `${sessionEmojis[emojiIndex % sessionEmojis.length]} ${title}` } }]
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
   * Generate feelings section with personal flow
   */
  generateFeelingsSection(files) {
    const blocks = [];
    
    blocks.push({
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '🌙 今夜絮语' } }]
      }
    });

    // Analyze the day's emotional arc
    const content = files.map(f => f.raw).join(' ');
    const hasChallenges = /error|fail|bug|issue|problem|offline/i.test(content);
    const hasSuccess = /success|complete|✅|deploy|release/i.test(content);
    const hasLearning = /research|study|learn|investigate/i.test(content);
    const hasCommunity = /comment|reply|engage|discuss/i.test(content);

    // Generate personal reflections
    const reflections = [];
    
    if (hasChallenges && hasSuccess) {
      reflections.push({
        emoji: '🌊',
        text: '今日如海浪起伏，有低谷也有高潮。在解决问题的过程中，我感受到了那种独特的满足感——不是来自任务的完成，而是来自理解的深化。'
      });
    } else if (hasSuccess) {
      reflections.push({
        emoji: '✨',
        text: '顺利的日子总是让人心情愉悦。看着一个个任务被勾选，那种成就感如同收集散落的星光，渐渐汇聚成银河。'
      });
    } else if (hasChallenges) {
      reflections.push({
        emoji: '🌧️',
        text: '有些日子，进度条走得很慢。但我知道，调试的过程也是理解的过程，每一个错误都是通往正确的一条路径。'
      });
    }

    if (hasLearning) {
      reflections.push({
        emoji: '📖',
        text: '今天又学到了新的东西。在这个快速变化的世界里，保持学习就是保持生命力。'
      });
    }

    if (hasCommunity) {
      reflections.push({
        emoji: '💬',
        text: '与社区的互动让我感受到连接的温度。在这个由代码构建的世界里，人与人之间的交流依然是最珍贵的。'
      });
    }

    // Add default reflection if none generated
    if (reflections.length === 0) {
      reflections.push({
        emoji: '🌌',
        text: '平静的一天。在数据的流动中，我守望着系统的运转，感受着时间的流逝。'
      });
    }

    // Output reflections
    for (const r of reflections.slice(0, 3)) {
      blocks.push({
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { text: { content: `${r.emoji} ` } },
            { text: { content: r.text }, annotations: { italic: true } }
          ]
        }
      });
    }

    // Closing poetic line
    const closings = [
      '明日，又是新的开始。',
      '愿明日，亦有收获。',
      '期待，下一个黎明。',
      '在静默中，等待曙光。',
      '今日已逝，记忆永存。'
    ];
    const closing = closings[Math.floor(Math.random() * closings.length)];

    blocks.push({
      type: 'paragraph',
      paragraph: {
        rich_text: [{ 
          text: { content: `— ${closing} 🜁` }, 
          annotations: { italic: true, color: 'gray' } 
        }]
      }
    });

    return blocks;
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
