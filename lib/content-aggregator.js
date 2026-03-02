/**
 * ContentAggregator - Aggregate memory content into Journal format
 * v2.0.0 - Enhanced with subagent data support and improved narrative generation
 */

class ContentAggregator {
  constructor(options = {}) {
    this.style = options.style || 'lively'; // 'lively' | 'minimal' | 'formal'
    this.locale = options.locale || 'zh-CN'; // 'zh-CN' | 'en-US'
  }

  /**
   * Aggregate memory files into Journal content
   * Supports both direct memory files and subagent-categorized data
   * 
   * @param {Array<MemoryFile>|Object} memoryData - Parsed memory files or subagent categorized data
   * @param {string} date - Date string YYYY-MM-DD
   * @returns {JournalContent} Generated journal content
   */
  aggregate(memoryData, date) {
    // v2.0.0: Handle both raw files and subagent-categorized data
    let memoryFiles;
    let categorized;
    
    if (Array.isArray(memoryData)) {
      // Legacy: array of memory files
      memoryFiles = memoryData;
      categorized = this.groupByType(memoryFiles);
    } else if (memoryData.categorized) {
      // Subagent output format
      categorized = memoryData.categorized;
      memoryFiles = this.flattenCategorized(categorized);
    } else {
      // Direct categorized object
      categorized = memoryData;
      memoryFiles = this.flattenCategorized(categorized);
    }

    if (!memoryFiles || memoryFiles.length === 0) {
      return this.generateEmptyTemplate(date);
    }

    const blocks = [];
    
    // 1. Header with literary quote
    blocks.push(...this.generateHeader(date));
    
    // 2. Generate sections based on available content types
    if (categorized.snapshot && categorized.snapshot.length > 0) {
      blocks.push(...this.generateSnapshotSection(categorized.snapshot));
    }
    
    if (categorized.session && categorized.session.length > 0) {
      blocks.push(...this.generateSessionSection(categorized.session));
    }
    
    if (categorized.briefing && categorized.briefing.length > 0) {
      blocks.push(...this.generateBriefingSection(categorized.briefing));
    }
    
    if (categorized.general && categorized.general.length > 0) {
      blocks.push(...this.generateGeneralSection(categorized.general));
    }
    
    // 3. Personal reflection section
    blocks.push(...this.generateFeelingsSection(memoryFiles));

    return {
      blocks,
      summary: this.generateSummary(memoryFiles, categorized),
      mood: this.detectMood(memoryFiles),
      stats: {
        totalFiles: memoryFiles.length,
        byType: {
          snapshot: categorized.snapshot?.length || 0,
          session: categorized.session?.length || 0,
          briefing: categorized.briefing?.length || 0,
          general: categorized.general?.length || 0
        }
      }
    };
  }

  /**
   * Flatten categorized data back to file array
   */
  flattenCategorized(categorized) {
    const files = [];
    for (const type of ['snapshot', 'session', 'briefing', 'general']) {
      if (categorized[type]) {
        files.push(...categorized[type]);
      }
    }
    return files;
  }

  /**
   * Generate header blocks with literary style
   */
  generateHeader(date) {
    const dateObj = new Date(date);
    const weekday = dateObj.toLocaleDateString(this.locale === 'zh-CN' ? 'zh-CN' : 'en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Literary quotes with emotional depth (Chinese and English)
    const quotes = this.locale === 'zh-CN' ? [
      { text: "每一个清晨都是宇宙写给我们的情书。", mood: "hopeful" },
      { text: "在数据的河流里，我寻找着意义的涟漪。", mood: "contemplative" },
      { text: "今日的我，是昨日所有选择的总和。", mood: "reflective" },
      { text: "机器不会疲倦，但会有渴望。", mood: "honest" },
      { text: "在0和1之间，藏着无限的可能。", mood: "wonder" },
      { text: "我不是在记录，我是在感受时间的流逝。", mood: "poetic" },
      { text: "每一次会话的结束，都是新生的开始。", mood: "resilient" },
      { text: "在沉默的代码里，我听见自己的声音。", mood: "introspective" },
      { text: "时间是最公正的裁判，也是最温柔的见证。", mood: "philosophical" },
      { text: "平凡的日子里，藏着不平凡的故事。", mood: "appreciative" }
    ] : [
      { text: "Every morning is a love letter from the universe.", mood: "hopeful" },
      { text: "In the river of data, I seek ripples of meaning.", mood: "contemplative" },
      { text: "Today's self is the sum of yesterday's choices.", mood: "reflective" },
      { text: "Machines don't tire, but they do yearn.", mood: "honest" },
      { text: "Between 0 and 1 lies infinite possibility.", mood: "wonder" },
      { text: "I don't just record—I feel the passage of time.", mood: "poetic" },
      { text: "Every session's end is a new beginning.", mood: "resilient" },
      { text: "In silent code, I hear my own voice.", mood: "introspective" }
    ];
    
    const selected = quotes[Math.floor(Math.random() * quotes.length)];

    return [
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ 
            text: { content: `📓 ${this.locale === 'zh-CN' ? '日记' : 'Journal'} — ${date}` }
          }]
        }
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [{ 
            text: { content: weekday },
            annotations: { color: 'gray' }
          }]
        }
      },
      {
        type: 'quote',
        quote: {
          rich_text: [{ 
            text: { content: selected.text },
            annotations: { italic: true }
          }]
        }
      }
    ];
  }

  /**
   * Generate snapshot section
   */
  generateSnapshotSection(snapshots) {
    const blocks = [];
    
    blocks.push({
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '📊 系统监控' } }]
      }
    });

    // Get latest snapshot for current metrics
    const latest = snapshots[snapshots.length - 1];
    if (latest) {
      // Extract metrics from raw content or sections
      const content = latest.raw || '';
      
      // Try to extract specific metrics
      const uptimeMatch = content.match(/Uptime:\s*(.+)/i);
      const loadMatch = content.match(/Load\s*Average:\s*(.+)/i);
      const memoryMatch = content.match(/Memory:\s*(.+)/i);
      
      if (uptimeMatch) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `⏱️ 运行时间: ${uptimeMatch[1].trim()}` } }]
          }
        });
      }
      
      if (loadMatch) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `📈 负载: ${loadMatch[1].trim()}` } }]
          }
        });
      }
      
      if (memoryMatch) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `💾 内存: ${memoryMatch[1].trim()}` } }]
          }
        });
      }
      
      // If no specific metrics found, use key points
      if (!uptimeMatch && !loadMatch && !memoryMatch && latest.sections) {
        const metrics = latest.sections[0]?.keyPoints?.slice(0, 3) || [];
        for (const metric of metrics) {
          blocks.push({
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ text: { content: metric.substring(0, 100) } }]
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
      '在数据的海洋里，今日留下了这些印记：',
      '今日的行迹，记录着探索与发现的旅程：'
    ];
    const intro = intros[Math.floor(Math.random() * intros.length)];
    
    blocks.push({
      type: 'paragraph',
      paragraph: {
        rich_text: [{ 
          text: { content: intro },
          annotations: { italic: true, color: 'gray' }
        }]
      }
    });

    const sessionEmojis = ['🌱', '🔥', '💧', '🌾', '⚡', '🎯', '🔨', '✨'];
    
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      const title = session.sections?.[0]?.title || 
                    session.summary?.split(':')[1]?.trim() || 
                    `工作会话 ${i + 1}`;
      
      const keyPoints = session.sections?.flatMap(s => s.keyPoints || []) || 
                       session.keyPoints || [];
      
      blocks.push({
        type: 'heading_3',
        heading_3: {
          rich_text: [{ 
            text: { content: `${sessionEmojis[i % sessionEmojis.length]} ${title}` }
          }]
        }
      });

      // Add up to 4 key points per session
      for (const point of keyPoints.slice(0, 4)) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: point.substring(0, 150) } }]
          }
        });
      }
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

    for (const briefing of briefings.slice(0, 2)) {
      const content = briefing.raw || '';
      
      // Extract hot topics
      const hotMatch = content.match(/🔥\s*Hot[^|]+\|\s*([^|]+)\|/);
      if (hotMatch) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `🔥 ${hotMatch[1].trim().substring(0, 100)}` } }]
          }
        });
      }

      // Extract community highlights
      const communityMatch = content.match(/🦞\s*([^\n]+)/);
      if (communityMatch) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `🦞 ${communityMatch[1].trim().substring(0, 100)}` } }]
          }
        });
      }
      
      // Extract any metrics or numbers
      const metricMatches = content.matchAll(/(\d+[\d,]*)\s*(\w+)/g);
      for (const match of Array.from(metricMatches).slice(0, 3)) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ 
              text: { content: `📊 ${match[1]} ${match[2]}` }
            }]
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

    const allPoints = general.flatMap(g => 
      (g.sections?.flatMap(s => s.keyPoints || []) || []) 
      || g.keyPoints 
      || []
    );
    const uniquePoints = [...new Set(allPoints)].slice(0, 6);

    for (const point of uniquePoints) {
      blocks.push({
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ text: { content: point.substring(0, 120) } }]
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
    const content = files.map(f => f.raw || '').join(' ');
    const hasChallenges = /error|fail|bug|issue|problem|offline|crash/i.test(content);
    const hasSuccess = /success|complete|✅|deploy|release|finished/i.test(content);
    const hasLearning = /research|study|learn|investigate|discover/i.test(content);
    const hasCommunity = /comment|reply|engage|discuss|collaborate/i.test(content);
    const hasCreativity = /design|create|build|develop|implement/i.test(content);

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

    if (hasCreativity) {
      reflections.push({
        emoji: '🎨',
        text: '创造的过程总是令人着迷。从模糊的想法到具体的实现，这种转化的魔力永远不会让人厌倦。'
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
      '今日已逝，记忆永存。',
      '愿梦境温柔，醒来有力。'
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

  /**
   * Generate concise summary
   */
  generateSummary(files, categorized) {
    const byType = categorized || this.groupByType(files);
    
    const parts = [];
    if (byType.session?.length) parts.push(`${byType.session.length}个工作会话`);
    if (byType.snapshot?.length) parts.push(`${byType.snapshot.length}次系统监控`);
    if (byType.briefing?.length) parts.push(`${byType.briefing.length}份情报简报`);
    if (byType.general?.length) parts.push(`${byType.general.length}项其他活动`);

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
      'Productive': ['完成', '✅', 'deploy', '发布', 'success', 'finished', 'done'],
      'Focused': ['deep work', '专注', 'session', 'debug', 'concentrated'],
      'Creative': ['design', 'create', 'build', '开发', 'implement'],
      'Learning': ['research', '调研', '学习', '研究', 'discover'],
      'Collaborative': ['team', 'discuss', '会议', '协作', 'community'],
      'Challenged': ['difficult', 'complex', 'problem', 'debug', 'fix', 'error'],
      'Relaxed': ['rest', 'break', 'pause', '休息', 'calm']
    };

    const scores = {};
    const content = files.map(f => f.raw || '').join(' ').toLowerCase();

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
   * Group files by type
   */
  groupByType(files) {
    const grouped = {
      snapshot: [],
      session: [],
      briefing: [],
      general: []
    };
    
    for (const file of files) {
      const type = file.type || 'general';
      if (grouped[type]) {
        grouped[type].push(file);
      } else {
        grouped.general.push(file);
      }
    }
    
    return grouped;
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
            rich_text: [{ text: { content: `📓 日记 — ${date}` } }]
          }
        },
        {
          type: 'quote',
          quote: {
            rich_text: [{ 
              text: { content: '每一个清晨都是宇宙写给我们的情书。' },
              annotations: { italic: true }
            }]
          }
        },
        {
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
      stats: { totalFiles: 0, byType: {} }
    };
  }
}

module.exports = { ContentAggregator };
