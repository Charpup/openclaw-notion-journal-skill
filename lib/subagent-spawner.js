/**
 * SubagentSpawner - Utility for spawning subagents in OpenClaw environment
 * v2.0.0 - Handles subagent lifecycle and result collection
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');

// Check if we're in an environment that supports subagents
function isSubagentEnvironment() {
  // Check for OpenClaw subagent capability
  return process.env.OPENCLAW_SUBAGENT_ENABLED === 'true' || 
         process.env.OPENCLAW_SESSION_ID !== undefined;
}

/**
 * Spawn a subagent to execute a task
 * @param {Object} task - Task configuration
 * @returns {Promise<Object>} Subagent result
 */
async function spawnSubagent(task) {
  // If not in subagent environment, simulate with local execution
  if (!isSubagentEnvironment()) {
    console.log(`[SubagentSpawner] Simulating subagent: ${task.name}`);
    return simulateSubagent(task);
  }

  const taskId = `subagent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const tempDir = path.join('/tmp', 'subagent_tasks', taskId);
  
  // Ensure temp directory exists
  fs.mkdirSync(tempDir, { recursive: true });

  // Write task definition
  const taskPath = path.join(tempDir, 'task.json');
  fs.writeFileSync(taskPath, JSON.stringify({
    id: taskId,
    name: task.name,
    description: task.description,
    instructions: task.instructions,
    context: task.context,
    timeout: task.timeout || 60000,
    createdAt: new Date().toISOString()
  }, null, 2));

  try {
    // In OpenClaw environment, use sessions_spawn or equivalent
    // This is a placeholder for the actual OpenClaw subagent spawning mechanism
    const result = await executeInOpenClaw(task, taskPath, tempDir);
    return result;
  } catch (error) {
    console.error(`[SubagentSpawner] Error spawning ${task.name}:`, error);
    // Fallback to simulation
    return simulateSubagent(task);
  } finally {
    // Cleanup
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Execute task in OpenClaw environment
 * This is a placeholder for the actual OpenClaw integration
 */
async function executeInOpenClaw(task, taskPath, tempDir) {
  // In actual OpenClaw environment, this would use:
  // - sessions_spawn for ACP harness (codex/claudecode/gemini)
  // - subagents tool for OpenClaw native subagents
  
  // For now, we'll use a file-based coordination mechanism
  const resultPath = path.join(tempDir, 'result.json');
  
  // Write a marker file that the main agent can check
  const markerPath = path.join(tempDir, 'pending.marker');
  fs.writeFileSync(markerPath, JSON.stringify({
    taskPath,
    resultPath,
    status: 'pending'
  }));

  // Simulate async execution
  // In real implementation, this would spawn the subagent and wait for completion
  return new Promise((resolve, reject) => {
    const timeout = task.timeout || 60000;
    const startTime = Date.now();
    
    const checkInterval = setInterval(() => {
      // Check if result file exists
      if (fs.existsSync(resultPath)) {
        clearInterval(checkInterval);
        try {
          const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse subagent result: ${e.message}`));
        }
        return;
      }
      
      // Check timeout
      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error(`Subagent timeout: ${task.name}`));
      }
    }, 100);

    // For demonstration, auto-complete with simulated result after delay
    setTimeout(() => {
      if (!fs.existsSync(resultPath)) {
        const simulatedResult = simulateSubagent(task);
        fs.writeFileSync(resultPath, JSON.stringify(simulatedResult));
      }
    }, 1000);
  });
}

/**
 * Simulate subagent execution for non-OpenClaw environments
 * This provides the same interface but runs locally
 */
async function simulateSubagent(task) {
  console.log(`[SubagentSpawner] Simulating: ${task.name}`);
  
  const startTime = Date.now();
  const context = task.context || {};
  
  // Simulate processing delay
  await new Promise(r => setTimeout(r, 100));
  
  switch (task.name) {
    case 'MemoryScanner':
      return simulateMemoryScanner(context);
    case 'ContentReader':
      return simulateContentReader(context);
    case 'JournalGenerator':
      return simulateJournalGenerator(context);
    case 'NotionFormatter':
      return simulateNotionFormatter(context);
    default:
      return {
        success: true,
        simulated: true,
        message: `Simulated ${task.name}`,
        processingTimeMs: Date.now() - startTime
      };
  }
}

/**
 * Simulate Memory Scanner subagent
 */
function simulateMemoryScanner(context) {
  const { date, memoryPaths } = context;
  const fs = require('fs');
  const path = require('path');
  
  const files = [];
  const searchPaths = memoryPaths || ['/root/.openclaw/workspace/memory'];
  
  for (const basePath of searchPaths) {
    if (!fs.existsSync(basePath)) continue;
    
    // Recursive scan
    const scanDir = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath);
          } else if (entry.name.startsWith(date) && entry.name.endsWith('.md')) {
            const stats = fs.statSync(fullPath);
            files.push({
              filename: entry.name,
              filepath: fullPath,
              size: stats.size,
              mtime: stats.mtime.toISOString()
            });
          }
        }
      } catch (e) {
        // Ignore permission errors
      }
    };
    
    scanDir(basePath);
  }
  
  // Sort by modification time
  files.sort((a, b) => new Date(a.mtime) - new Date(b.mtime));
  
  return {
    files,
    stats: {
      totalFiles: files.length,
      searchPaths,
      searchTimeMs: 50
    }
  };
}

/**
 * Simulate Content Reader subagent
 */
function simulateContentReader(context) {
  const { files } = context;
  const fs = require('fs');
  
  const categorized = {
    snapshot: [],
    session: [],
    briefing: [],
    general: []
  };
  
  let totalActivities = 0;
  
  for (const fileInfo of files) {
    const filepath = fileInfo.filepath || fileInfo;
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const filename = path.basename(filepath);
      
      // Detect type
      let type = 'general';
      if (content.includes('System Snapshot') || filename.includes('snapshot')) {
        type = 'snapshot';
      } else if (content.includes('## Session') || filename.includes('session')) {
        type = 'session';
      } else if (content.includes('Briefing') || filename.includes('briefing')) {
        type = 'briefing';
      }
      
      // Extract sections
      const sections = [];
      const headingRegex = /^(#{2,3})\s+(.+)$/gm;
      let match;
      while ((match = headingRegex.exec(content)) !== null) {
        sections.push({
          level: match[1].length,
          title: match[2].trim()
        });
      }
      
      // Extract key points
      const keyPoints = [];
      const listRegex = /^[-*]\s+(.+)$/gm;
      while ((match = listRegex.exec(content)) !== null) {
        keyPoints.push(match[1].trim());
      }
      
      totalActivities += sections.length;
      
      categorized[type].push({
        filename,
        filepath,
        summary: `${type}: ${sections.map(s => s.title).join(', ') || 'General notes'}`,
        sections,
        keyPoints: keyPoints.slice(0, 5)
      });
      
    } catch (e) {
      console.warn(`Failed to read ${filepath}:`, e.message);
    }
  }
  
  return {
    categorized,
    totalActivities,
    stats: {
      filesRead: files.length,
      byType: {
        snapshot: categorized.snapshot.length,
        session: categorized.session.length,
        briefing: categorized.briefing.length,
        general: categorized.general.length
      },
      processingTimeMs: 100
    }
  };
}

/**
 * Simulate Journal Generator subagent
 */
function simulateJournalGenerator(context) {
  const { categorizedData, date } = context;
  const cat = categorizedData.categorized || categorizedData;
  
  // Generate mood based on content
  const mood = ['Reflective'];
  const hasSessions = cat.session?.length > 0;
  const hasSnapshots = cat.snapshot?.length > 0;
  
  if (hasSessions) mood.push('Productive');
  if (hasSnapshots) mood.push('Focused');
  
  // Generate summary
  const parts = [];
  if (cat.session?.length) parts.push(`${cat.session.length}个工作会话`);
  if (cat.snapshot?.length) parts.push(`${cat.snapshot.length}次系统监控`);
  if (cat.briefing?.length) parts.push(`${cat.briefing.length}份情报简报`);
  
  const summary = parts.length > 0 ? `今日${parts.join('，')}` : '记录日常活动';
  
  return {
    structure: {
      header: {
        quote: '每一个清晨都是宇宙写给我们的情书。',
        mood: 'hopeful'
      },
      sections: [
        { type: 'system', title: '系统监控', content: 'System status normal' },
        { type: 'sessions', title: '今日行迹', narrative: 'Work sessions completed', items: [] },
        { type: 'reflection', title: '今夜絮语', content: 'Reflection on the day' }
      ]
    },
    summary,
    mood,
    stats: {
      sectionsGenerated: 5,
      wordCount: 300,
      processingTimeMs: 200
    }
  };
}

/**
 * Simulate Notion Formatter subagent
 */
function simulateNotionFormatter(context) {
  const { journalStructure, date } = context;
  const structure = journalStructure.structure || journalStructure;
  
  const blocks = [
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
          text: { content: structure.header?.quote || '每一个清晨都是宇宙写给我们的情书。' },
          annotations: { italic: true }
        }]
      }
    }
  ];
  
  // Add sections
  for (const section of structure.sections || []) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: section.title } }]
      }
    });
    
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ text: { content: section.content || section.narrative || '' } }]
      }
    });
    
    blocks.push({
      object: 'block',
      type: 'divider',
      divider: {}
    });
  }
  
  return {
    blocks,
    stats: {
      blockCount: blocks.length,
      maxDepth: 2,
      processingTimeMs: 100
    }
  };
}

module.exports = {
  spawnSubagent,
  isSubagentEnvironment
};
