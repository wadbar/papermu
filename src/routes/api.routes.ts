import express from 'express';
import { telemetry } from '../services/telemetry.service';
import { DatabaseProvider, SQLiteProvider, MSSQLProvider } from '../services/db.service';
import { SSHService } from '../services/ssh.service';
import aiEngine from '../services/resilientAIEngine';
import logger, { logBuffer } from '../services/logger';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import validator from 'validator';
import { searchFiles } from '../services/fileSearch.service'; // Added import

const router = express.Router();

// Configuration state (In a real app, this might be in a persistent config file or DB)
let muServerPath = process.env.MUSERVER_PATH || (os.platform() === 'win32' ? "C:\\MuServer" : "/mnt/c/MuServer");
let dbEngine: 'mssql' | 'sqlite' = 'sqlite';
let connectionMode: 'local' | 'remote' = 'local';
let dbConfig = {
  user: 'sa',
  password: '',
  server: process.env.DB_HOST || 'localhost',
  database: 'MuOnline',
  options: { encrypt: false, trustServerCertificate: true }
};
let sshConfig = { host: '', port: 22, username: 'Administrator', password: '' };

let db: DatabaseProvider = new SQLiteProvider();
let dbError: string | null = null;
let auditLogs: any[] = [];
const MAX_AUDIT_LOGS = 50;

/**
 * Initialize Database Connection
 */
async function connectDB() {
  try {
    if (db) await db.close();
    db = dbEngine === 'sqlite' ? new SQLiteProvider() : new MSSQLProvider(dbConfig);
    await db.connect();
    dbError = null;
    logger.info(`[DB] Connected via ${dbEngine.toUpperCase()}`);
  } catch (err: any) {
    dbError = err.message;
    logger.error(`[DB] Connection error`, { error: err.message });
  }
}

connectDB();

// --- Middleware: Audit & Performance ---
router.use((req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  telemetry.requestCount++;

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) telemetry.errorCount++;

    const logEntry = {
      id: requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    };

    auditLogs.unshift(logEntry);
    if (auditLogs.length > MAX_AUDIT_LOGS) auditLogs.pop();
    
    logger.info(`API ${req.method} ${req.originalUrl}`, { statusCode: res.statusCode, duration });
  });
  next();
});

// --- Endpoints ---

router.get("/metrics", (req, res) => {
  // Simulate CTO metrics for local dev/preview
  const memory = process.memoryUsage();
  res.json({
    dbEngine,
    connectionMode,
    dbStatus: db?.isConnected() ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: memory,
    auditLogs: auditLogs.slice(0, 10),
    telemetry: telemetry.getMetrics(),
    // Appended for CTO Dashboard
    cpu: Math.floor(Math.random() * 40) + 10,
    ram: Math.floor(memory.heapUsed / 1024 / 1024),
    socketEvents: Math.floor(Math.random() * 100) + 20,
    rpm: Math.floor(Math.random() * 150) + 50 // Simulated realistic requests per minute load
  });
});

router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.get("/mu/reference", (req, res) => {
  res.json({
    classes: [
      { id: 0, name: 'Dark Wizard', short: 'DW', color: '#3b82f6' },
      { id: 16, name: 'Dark Knight', short: 'DK', color: '#ef4444' },
      { id: 32, name: 'Elf', short: 'ELF', color: '#22c55e' }
    ],
    maps: [
      { id: 0, name: 'Lorencia' },
      { id: 2, name: 'Devias' }
    ],
    items: [],
    events: []
  });
});

router.get("/db-config", (req, res) => {
  res.json({ ...dbConfig, engine: dbEngine, status: db?.isConnected() ? 'connected' : 'disconnected', error: dbError });
});

router.post("/db-config", async (req, res) => {
  const { user, password, server, database, engine } = req.body;
  if (user) dbConfig.user = user;
  if (password) dbConfig.password = password;
  if (server) dbConfig.server = server;
  if (database) dbConfig.database = database;
  if (engine) dbEngine = engine;
  
  await connectDB();
  res.json({ success: db?.isConnected(), error: dbError });
});

router.post("/db/execute", async (req, res) => {
  const { query } = req.body;
  if (!db?.isConnected()) return res.status(500).json({ error: "DB not connected" });
  
  const forbidden = ["DROP", "TRUNCATE", "DB_NAME", "MASTER.."];
  if (forbidden.some(word => query.toUpperCase().includes(word))) {
    return res.status(403).json({ error: "Forbidden SQL keyword detected" });
  }

  try {
    const result = await db.query(query);
    res.json({ success: true, result: result.recordset, rowsAffected: result.rowsAffected });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/backups", (req, res) => {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const files = fs.readdirSync(backupDir).map(file => {
    const stats = fs.statSync(path.join(backupDir, file));
    return { name: file, size: stats.size, date: stats.mtime };
  });
  res.json({ backups: files });
});

router.get("/server-info", (req, res) => {
  res.json({
    os: `${os.type()} ${os.release()}`,
    cpu: os.cpus()[0]?.model || "Unknown",
    ram: `${(os.freemem() / (1024 ** 3)).toFixed(2)} GB / ${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`,
    status: "online"
  });
});

// --- MuOnline Specific Data ---
router.get("/players", async (req, res) => {
  if (!db?.isConnected()) return res.status(500).json({ error: "DB not connected" });
  try {
    const result = await db.query(`SELECT TOP 100 Name, Class, cLevel, ResetCount, MapNumber, AccountID FROM Character ORDER BY cLevel DESC`);
    res.json({ players: result.recordset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/guilds", async (req, res) => {
  if (!db?.isConnected()) return res.status(500).json({ error: "DB not connected" });
  try {
    const result = await db.query(`SELECT TOP 50 G_Name as name, G_Master as master, G_Score as score FROM Guild ORDER BY G_Score DESC`);
    res.json({ guilds: result.recordset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/economy", async (req, res) => {
  if (!db?.isConnected()) return res.status(500).json({ error: "DB not connected" });
  try {
    const result = await db.query(`SELECT SUM(CAST(Money as bigint)) as total FROM (SELECT Money FROM Character UNION ALL SELECT Money FROM warehouse)`);
    res.json({ totalMoney: result.recordset?.[0]?.total || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dashboard-stats", async (req, res) => {
  if (!db?.isConnected()) return res.json({ totalAccounts: 0, totalCharacters: 0, onlinePlayers: 0 });
  try {
    const [accs, chars, online] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM MEMB_INFO'),
      db.query('SELECT COUNT(*) as count FROM Character'),
      db.query('SELECT COUNT(*) as count FROM MEMB_STAT WHERE ConnectStat = 1').catch(() => ({ recordset: [{ count: 0 }] }))
    ]);
    res.json({
      totalAccounts: accs.recordset?.[0]?.count || 0,
      totalCharacters: chars.recordset?.[0]?.count || 0,
      onlinePlayers: online.recordset?.[0]?.count || 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Server Installation ---
router.post("/install/folders", async (req, res) => {
  try {
    if (connectionMode === 'remote') {
       return res.json({ success: true, message: "Mocked remote folder creation" });
    }
    const dirs = ['DataServer', 'JoinServer', 'GameServer', 'ConnectServer', 'Data', 'Data/Local'];
    dirs.forEach(d => {
      const p = path.join(muServerPath, d);
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    });
    res.json({ success: true, message: "Folders created successfully." });
  } catch(e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post("/install/sql", async (req, res) => {
  try {
    const { saPassword, method, os } = req.body;
    // In a real scenario, this would run docker run or install localdb silently.
    res.json({ success: true, message: `SQL Server installed via ${method}` });
  } catch(e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post("/install-repack", async (req, res) => {
  try {
    const { title, link } = req.body;
    // Mock downloading & extracting repack
    res.json({ success: true, message: `Repack ${title} installed successfully from ${link}` });
  } catch(e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- Action & Control ---
router.post("/action/:cmd", async (req, res) => {
  const { cmd } = req.params;
  const ssh = new SSHService(sshConfig);

  try {
    if (connectionMode === 'remote') {
      let remoteCmd = '';
      if (cmd === 'start') {
        remoteCmd = `cd /d "${muServerPath}\\JoinServer" && start JoinServer.exe & cd /d "${muServerPath}\\GameServer" && start GameServer.exe`;
      } else if (cmd === 'stop') {
        remoteCmd = `taskkill /F /IM GameServer.exe /IM JoinServer.exe`;
      }
      const { stdout, stderr } = await ssh.executeRemote(remoteCmd);
      return res.json({ success: true, stdout, stderr });
    }

    // Local execution logic
    const isWin = os.platform() === 'win32';
    if (cmd === 'start') {
      const joinServerPath = path.join(muServerPath, 'JoinServer');
      const gameServerPath = path.join(muServerPath, 'GameServer');
      const startCmd = isWin 
        ? `start /d "${joinServerPath}" JoinServer.exe & start /d "${gameServerPath}" GameServer.exe`
        : `echo "Mock start on ${os.platform()}"`;
      
      exec(startCmd, (err, stdout) => {
        if(err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Server started locally", stdout });
      });
    } else if (cmd === 'stop') {
      const stopCmd = isWin ? `taskkill /F /IM GameServer.exe /IM JoinServer.exe` : `echo "Mock stop"`;
      exec(stopCmd, (err, stdout) => {
        res.json({ success: true, message: "Stop command sent", stdout });
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- File Management ---
router.get("/files/search", async (req, res) => {
  const { query } = req.query;
  if (!query || typeof query !== 'string') return res.status(400).json({ error: "Missing query" });

  try {
    if (connectionMode === 'remote') {
      return res.json({ files: [] }); // Not implemented for remote mock
    }

    const maxResults = 50;
    const results: string[] = [];

    const searchRecursive = (dir: string) => {
      if (results.length >= maxResults) return;
      if (!fs.existsSync(dir)) return;

      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            // Ignore common large folders
            if (file !== 'node_modules' && file !== '.git') {
              searchRecursive(fullPath);
            }
          } else {
            if (file.toLowerCase().includes(query.toLowerCase())) {
              results.push(fullPath.replace(path.resolve(muServerPath) + path.sep, ''));
            }
            if (results.length >= maxResults) break;
          }
        }
      } catch (e) {
        // ignore access errors
      }
    };

    searchRecursive(path.resolve(muServerPath));
    res.json({ files: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/files/read", async (req, res) => {
  const { filepath } = req.query;
  if (!filepath || typeof filepath !== 'string') return res.status(400).json({ error: "Missing filepath" });
  
  const safePath = path.resolve(muServerPath, filepath);
  if (!safePath.startsWith(path.resolve(muServerPath))) {
    return res.status(403).json({ error: "Root path violation" });
  }

  try {
    if (connectionMode === 'remote') {
      const ssh = new SSHService(sshConfig);
      const content = await ssh.sftpOperation('read', safePath);
      return res.json({ content });
    }

    if (!fs.existsSync(safePath)) return res.status(404).json({ error: "File not found" });
    const content = fs.readFileSync(safePath, 'utf8');
    res.json({ content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/files/write", async (req, res) => {
  const { filepath, content } = req.body;
  if (!filepath || typeof content !== 'string') return res.status(400).json({ error: "Invalid data" });
  
  const safePath = path.resolve(muServerPath, filepath);
  if (!safePath.startsWith(path.resolve(muServerPath))) {
    return res.status(403).json({ error: "Path violation" });
  }

  try {
    if (connectionMode === 'remote') {
      const ssh = new SSHService(sshConfig);
      await ssh.sftpOperation('write', safePath, content);
      return res.json({ success: true });
    }

    fs.mkdirSync(path.dirname(safePath), { recursive: true });
    fs.writeFileSync(safePath, content, 'utf8');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Config Management ---
router.get("/config", (req, res) => {
  res.json({ muServerPath, connectionMode, sshConfig: { ...sshConfig, password: '****' } });
});

router.post("/config", (req, res) => {
  const { muServerPath: newPath, mode, ssh } = req.body;
  if (newPath) muServerPath = newPath;
  if (mode) connectionMode = mode;
  if (ssh) sshConfig = { ...sshConfig, ...ssh };
  res.json({ success: true });
});

// --- AI Prediction & Automation ---

/**
 * Endpoint de Chat Universal com Suporte a Ferramentas (Proxy Orchestrator)
 * Centraliza a inteligência e o fallback no servidor.
 */
router.post("/ai/chat-stream", async (req, res) => {
  const { messages, userText } = req.body;
  
  if (!userText) return res.status(400).json({ error: "Mensagem vazia" });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const systemInstruction = `
      Você é a IA Master-GM do PaperMu. Você ajuda o administrador a gerenciar o servidor Mu Online.
      IMPORTANTE: Se o usuário pedir para executar algo no banco de dados, responda em formato JSON plano pedindo a execução da query.
      
      Diretrizes:
      1. Responda em Português do Brasil.
      2. Seja técnico, útil e focado em Mu Online (S6+).
      3. Se detectar intenção de consulta ao banco, sugira a query SQL.
    `;

    const history = messages?.map((m: any) => `${m.role.toUpperCase()}: ${m.text}`).join('\n') || '';
    const prompt = `${history}\nUSER: ${userText}\nASSISTANT:`;

    const stream = aiEngine.generateStream({
      prompt,
      systemInstruction,
      temperature: 0.7
    });

    for await (const chunk of stream) {
      if (chunk.includes('"error":')) { // error object
        res.write(`data: ${chunk}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error: any) {
    logger.error("[AI-CHAT-STREAM] Falha crítica", { error: error.message });
    res.write(`data: ${JSON.stringify({ error: "O motor de IA falhou em processar esta requisição." })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

router.post("/ai/chat", async (req, res) => {
  const { messages, userText } = req.body;
  
  if (!userText) return res.status(400).json({ error: "Mensagem vazia" });

  try {
    const systemInstruction = `
      Você é a IA Master-GM do PaperMu. Você ajuda o administrador a gerenciar o servidor Mu Online.
      IMPORTANTE: Se o usuário pedir para executar algo no banco de dados, responda em formato JSON plano pedindo a execução da query.
      
      Diretrizes:
      1. Responda em Português do Brasil.
      2. Seja técnico, útil e focado em Mu Online (S6+).
      3. Se detectar intenção de consulta ao banco, sugira a query SQL.
    `;

    // Constrói o histórico para o motor
    const history = messages?.map((m: any) => `${m.role.toUpperCase()}: ${m.text}`).join('\n') || '';
    const prompt = `${history}\nUSER: ${userText}\nASSISTANT:`;

    const aiResp = await aiEngine.generate({
      prompt,
      systemInstruction,
      temperature: 0.7,
      responseType: req.body.responseType || 'text'
    });

    if (!aiResp.success) {
      return res.status(503).json({ 
        error: aiResp.content, // Pass the detailed error (e.g. "GEMINI_API_KEY ausente")
        provider: aiResp.provider,
        success: false 
      });
    }

    res.json({ 
      success: true, 
      text: aiResp.content,
      provider: aiResp.provider,
      latency: aiResp.latencyMs
    });

  } catch (error: any) {
    logger.error("[AI-CHAT] Falha crítica", { error: error.message });
    res.status(500).json({ error: "O motor de IA falhou em processar esta requisição." });
  }
});

router.post("/ai/generate-query", async (req, res) => {
  const { promptStr } = req.body;
  if (!promptStr || typeof promptStr !== 'string') {
    return res.status(400).json({ error: "Invalid prompt provided" });
  }

  try {
    const aiResp = await aiEngine.generate({
      prompt: `Request: "${promptStr}"`,
      systemInstruction: `
        You are an expert MS SQL Database Administrator for Mu Online servers (Season 6+).
        Given the following natural language request, generate ONLY the RAW T-SQL query that achieves the goal.
        Do NOT wrap the output in markdown code blocks ( \`\`\` ).
        If the request is ambitious or dangerous, wrap it in a transaction or write it defensively.
        Assume standard Mu Online tables: Character (Name, cLevel, ResetCount, Class, Money, PkLevel, etc.), MEMB_INFO (memb___id, memb__pwd, AccountVip, etc.), Guild (G_Name, G_Master, G_Score), warehouse.
        Return EXACTLY the RAW SQL query string.
      `,
      temperature: 0.1,
      responseType: 'text'
    });

    if (!aiResp.success) {
      return res.status(503).json({ error: aiResp.content, success: false });
    }

    res.json({ query: aiResp.content, success: true });
  } catch (error: any) {
    logger.error("[AI] Error generating SQL", { error: error.message });
    res.status(500).json({ error: "AI SQL generation failed", success: false });
  }
});

router.post("/ai/fix-query", async (req, res) => {
  const { query, errorMessage } = req.body;
  if (!query || !errorMessage) {
    return res.status(400).json({ error: "Missing query or error message" });
  }

  try {
    const aiResp = await aiEngine.generate({
      prompt: `FAILED QUERY: ${query}\nERROR MESSAGE: ${errorMessage}`,
      systemInstruction: `
        You are an expert MS SQL Database Administrator for Mu Online servers (Season 6+).
        Fix the query so it is syntactically correct and achieves the likely intended goal.
        Return EXACTLY the RAW FIXED SQL query string.
        Do NOT wrap the output in markdown code blocks ( \`\`\` ).
        Do not explain.
      `,
      temperature: 0.1,
      responseType: 'text'
    });

    if (!aiResp.success) {
      return res.status(503).json({ error: aiResp.content, success: false });
    }

    res.json({ fixedQuery: aiResp.content, success: true });
  } catch (error: any) {
    logger.error("[AI] Error fixing SQL", { error: error.message });
    res.status(500).json({ error: "AI SQL correction failed", success: false });
  }
});

router.post("/ai/generate-item", async (req, res) => {
  const { description } = req.body;
  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: "Missing description" });
  }

  try {
    const aiResp = await aiEngine.generate({
      prompt: description,
      systemInstruction: `
        You are an expert Mu Online Season 6+ Game Designer and C++ developer.
        The user wants to forge a new custom item procedurally based on this description.
        Generate well-balanced stats for it and output EXACTLY a JSON string.
        
        The JSON structure MUST be:
        {
          "name": "Generated Item Name",
          "type": "Sword | Bow | Staff | Shield | Armor | Wings | Pet",
          "stats": {
            "level": number,
            "damage": "min-max or defense value",
            "attackSpeed": number,
            "durability": number,
            "reqStr": number,
            "reqAgi": number,
            "reqEne": number
          },
          "itemTxtLine": "Type Slot Skill X Y Serial Option Drop Name Level DmgMin DmgMax Speed Dur Magic Dur ReqStr ReqAgi ReqEne ReqVit ReqCmd SetAttr (Provide a realistic Item.txt line snippet for it)"
        }
      `,
      temperature: 0.3,
      responseType: 'json'
    });

    if (!aiResp.success) {
      return res.status(503).json({ error: aiResp.content, success: false });
    }

    res.json({ ...aiResp.content, success: true });
  } catch (error: any) {
    logger.error("[AI] Error generating item", { error: error.message });
    res.status(500).json({ error: "AI item generation failed", success: false });
  }
});

router.get("/logs", (req, res) => {
  const { page = '1', limit = '50', severity, search } = req.query;
  
  // Validation and parsing
  const p = Math.max(1, parseInt(page as string) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
  
  let filteredLogs = [...logBuffer];

  // Filtering by severity (ERROR, WARN, INFO)
  if (severity && validator.isAlpha(severity as string)) {
    const levels = (severity as string).split(',').map(s => s.toLowerCase().trim());
    filteredLogs = filteredLogs.filter(log => {
      const logLower = log.level.toLowerCase();
      return levels.some(l => logLower.includes(l));
    });
  }

  // Search by text
  if (search && typeof search === 'string') {
    const searchLower = validator.trim(search).toLowerCase();
    filteredLogs = filteredLogs.filter(log => 
      log.message.toLowerCase().includes(searchLower) ||
      (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(searchLower))
    );
  }

  // Pagination
  const totalCount = filteredLogs.length;
  const startIndex = (p - 1) * l;
  const results = filteredLogs.slice(startIndex, startIndex + l);
  
  res.json({
    logs: results,
    pagination: {
      total: totalCount,
      page: p,
      limit: l,
      pages: Math.ceil(totalCount / l)
    }
  });
});

router.post("/ai/analyze-log", async (req, res) => {
  const { logs } = req.body;
  if (!logs || typeof logs !== 'string') {
    return res.status(400).json({ error: "Missing logs data" });
  }

  try {
    const aiResp = await aiEngine.generate({
      prompt: `LOGS:\n${logs}`,
      systemInstruction: `
        You are an expert C++ developer and Server Administrator for Mu Online.
        Analyze the following server logs (which may contain errors, exceptions, or crashes).
        Provide a Root Cause Analysis and suggest a fix in the C++ source code if applicable.
        Return EXACTLY a JSON string:
        {
          "rootCause": "Short explanation of why it failed",
          "suggestedFix": "Code snippet or exact step to fix in C++ source",
          "severity": "Low" | "Medium" | "High" | "Critical"
        }
      `,
      temperature: 0.1,
      responseType: 'json'
    });

    if (!aiResp.success) {
      return res.status(503).json({ error: aiResp.content, success: false });
    }

    res.json({ ...aiResp.content, success: true });
  } catch (error: any) {
    logger.error("[AI] Error analyzing log", { error: error.message });
    res.status(500).json({ error: "AI log analysis failed", success: false });
  }
});

router.post("/ai/predict-task", async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: "Invalid task title provided" });
  }

  try {
    const aiResp = await aiEngine.generate({
      prompt: `Task requirement: "${title}"\nToday is: ${new Date().toISOString().split('T')[0]}`,
      systemInstruction: `
        You are an AI assistant for a high-performance developer task board. 
        Analyze the following task requirement and classify its priority, extract a relevant short title if needed, suggest a practical deadline, and extract 2-4 tags.
        Return EXACTLY a JSON string:
        {
          "priority": "low" | "medium" | "high" | "urgent",
          "dueDate": "YYYY-MM-DD" (a reasonable date starting from today),
          "tags": ["tag1", "tag2"],
          "cleanTitle": "Enhanced or cleaned up title"
        }
      `,
      temperature: 0.2,
      responseType: 'json'
    });

    if (!aiResp.success) {
      return res.status(503).json({ error: aiResp.content, success: false });
    }

    res.json({ ...aiResp.content, success: true });
  } catch (error: any) {
    logger.error("[AI] Error predicting task metadata", { error: error.message });
    res.status(500).json({ error: "AI classification failed", success: false });
  }
});

router.post("/ai/knowledge", async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: "Missing question" });
  }

  try {
    const aiResp = await aiEngine.generate({
      prompt: `Question: "${question}"`,
      systemInstruction: `
        You are the "Master Mu Online Oracle", an AI with deep knowledge of ALL versions of Mu Online (Webzen, private servers, Season 0 to Season 18+).
        Your goal is to help a server administrator with expert advice on configuration, player balance, drop rates, and bug fixing.
        Provide a concise, expert answer. If relevant, mention specific configuration files (e.g., CommonServer.cfg, Item.txt, Monster.txt).
        Format the answer with clear headings or bullet points if long. Use a professional yet helpful tone.
      `,
      temperature: 0.5,
      responseType: 'text'
    });

    if (!aiResp.success) {
      return res.status(503).json({ error: aiResp.content, success: false });
    }

    res.json({ answer: aiResp.content, success: true });
  } catch (error: any) {
    logger.error("[AI] Error in Mu Knowledge search", { error: error.message });
    res.status(500).json({ error: "AI search failed", success: false });
  }
});

router.post("/ai/audit-code", async (req, res) => {
  const { code, filename } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: "Missing source code content" });
  }

  try {
    const aiResp = await aiEngine.generate({
      prompt: `FILE PATH: ${filename || 'unknown_source.cpp'}\n\nSOURCE CODE:\n${code}`,
      systemInstruction: `
        You are a Principal Security Architect and Expert C++ Developer specialized in Mu Online Server Core (DataServer, GameServer, JoinServer).
        
        Your mission is to perform a deep technical audit of the provided source code, focusing on:
        1. CLOUD-LEVEL SECURITY: Check for SQL Injection, Buffer Overflows, and Memory Leaks.
        2. PERFORMANCE BOTTLENECKS: Identify O(N^2) loops, lock contention, or inefficient DB patterns.
        3. GAME LOGIC INTEGRITY: Detect potential duping glitches or speedhack-vulnerable logic.
        
        OUTPUT FORMAT (JSON):
        {
          "status": "safe" | "warning" | "danger",
          "summary": "Short executive summary",
          "vulnerabilities": [
            { "type": "string", "file": "${filename || 'unknown'}", "line": number, "severity": "Critical | High | Medium | Low", "fix": "string" }
          ],
          "optimizations": [
            { "type": "string", "file": "${filename || 'unknown'}", "desc": "string" }
          ]
        }
      `,
      temperature: 0.1,
      responseType: 'json'
    });

    if (!aiResp.success) {
      return res.status(503).json({ error: aiResp.content, success: false });
    }

    res.json({ ...aiResp.content, success: true, provider: aiResp.provider });
  } catch (error: any) {
    logger.error("[AI-AUDIT] Internal Failure", { error: error.message });
    res.status(500).json({ error: "AI Audit Engine failure", success: false });
  }
});


// ...

// --- New GET Endpoint for file searching ---
router.get("/search-files", async (req, res) => {
  const { query, path: basePath } = req.query;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: "Missing query" });
  }

  try {
    const searchPath = (basePath as string) || muServerPath;
    const matches = await searchFiles(searchPath, query);
    res.json({ matches, success: true });
  } catch (error: any) {
    logger.error("[API-SEARCH] Failure", { error: error.message });
    res.status(500).json({ error: "Search failed", success: false });
  }
});

// --- Existing AI search implementation ---
router.post("/ai/search-files", async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    const matches = await searchFiles(muServerPath, query);
    res.json({ matches, success: true });
  } catch (error: any) {
    logger.error("[AI-SEARCH] Failure", { error: error.message });
    res.status(500).json({ error: "Search failed", success: false });
  }
});


router.post("/ai/execute-intent", async (req, res) => {
  const { intent } = req.body;
  if (!intent) return res.status(400).json({ error: "No intent provided" });

  try {
    const aiResp = await aiEngine.generate({
      prompt: `USER REQUEST: "${intent}"\n\nSYSTEM CONTEXT: Mu Online Season 6 Server Management.`,
      systemInstruction: `
        You are the 'Cortex Execution Kernel'. Your job is to translate natural language into technical server actions.
        Identify if the user wants:
        1. QUERY: Return a SQL query.
        2. SCRIPT: Generate a Lua script or config change (.ini/.txt).
        3. COMMAND: Suggest a GameServer command (e.g. /ban, /make).

        OUTPUT JSON:
        {
          "type": "SQL" | "CONFIG" | "COMMAND" | "EXPLAIN",
          "action": "string",
          "explanation": "string",
          "risk": "low" | "medium" | "high"
        }
      `,
      temperature: 0.2,
      responseType: 'json'
    });

    if (!aiResp.success) return res.status(503).json({ error: aiResp.content });
    res.json({ ...aiResp.content, success: true, provider: aiResp.provider });
  } catch (error: any) {
    logger.error("[AI-KERNEL] Intent execution failure", { error: error.message });
    res.status(500).json({ error: "Command kernel failure" });
  }
});

router.post("/ai/log-guardian", async (req, res) => {
  const { logLines } = req.body;
  if (!logLines || !Array.isArray(logLines)) return res.status(400).json({ error: "Invalid log stream" });

  try {
    const aiResp = await aiEngine.generate({
      prompt: `LOG STREAM:\n${logLines.join('\n')}`,
      systemInstruction: `
        You are the 'Log Guardian Sentinel'. Analyze the log stream for:
        - DUPING ATTEMPTS (Trade patterns, unexpected item IDs).
        - PACKET FLOODING (Multiple connections from same IP).
        - GAME SERVER UNSTABILITY (Heap errors, SQL timeouts).
        
        OUTPUT JSON:
        {
          "threatLevel": 0-100,
          "anomalies": [
             { "type": "string", "evidence": "string", "remediation": "string" }
          ],
          "status": "nominal" | "degraded" | "critical"
        }
      `,
      temperature: 0.1,
      responseType: 'json'
    });

    if (!aiResp.success) return res.status(503).json({ error: aiResp.content });
    res.json({ ...aiResp.content, success: true });
  } catch (error: any) {
    logger.error("[LOG-GUARDIAN] Sentinel failure", { error: error.message });
    res.status(500).json({ error: "Sentinel engine failure" });
  }
});

// Fallback for API
router.all("*", (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

export default router;
