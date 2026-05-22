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
import { apiCache } from '../services/cache.service'; // Added import

import { configService } from '../services/config.service';

const router = express.Router();

// Configuration state initialized from configService
const currentConfig = configService.get();
let muServerPath = currentConfig.muServerPath;
let dbEngine = currentConfig.dbEngine;
let connectionMode = currentConfig.connectionMode;
let maintenanceMode = currentConfig.maintenanceMode;
let dbConfig = { ...currentConfig.dbConfig, password: '' };
let sshConfig = { ...currentConfig.sshConfig, password: '' };

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

// --- Middleware: Audit, Performance & Shield ---
const SHIELD_ENABLED = true;

router.use((req, res, next) => {
  logger.info(`[API-ROUTER] Processing: ${req.method} ${req.path}`);
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  telemetry.requestCount++;

  // Security Shield: Basic parameter sanitization reinforcement
  if (SHIELD_ENABLED && req.body) {
    const bodyStr = JSON.stringify(req.body);
    if (bodyStr.includes('<script') || bodyStr.includes('javascript:')) {
      logger.warn(`[SHIELD] Blocked suspicious XSS payload from ${req.ip}`);
      return res.status(403).json({ error: "Security Shield: Malicious payload signature detected." });
    }
  }

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

router.get("/performance", (req, res) => {
  const v8 = require('v8');
  const memoryUsage = process.memoryUsage();
  const heapStats = v8.getHeapStatistics();
  res.json({
    memoryUsage,
    heapStats,
    uptime: process.uptime(),
    pid: process.pid,
    arch: process.arch,
    platform: process.platform
  });
});

router.post("/performance/gc", (req, res) => {
  if (global.gc) {
    global.gc();
    res.json({ success: true, message: "Garbage collection triggered" });
  } else {
    res.status(400).json({ success: false, error: "Garbage collection not exposed. Run node with --expose-gc" });
  }
});

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
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    sentinel: "active",
    shield: SHIELD_ENABLED ? "engaged" : "disabled"
  });
});

router.get("/health/deep", async (req, res) => {
  const start = Date.now();
  const diagnostics: any = {
    db: { status: 'checking' },
    fs: { status: 'checking' },
    ai: { status: 'checking' }
  };

  try {
    diagnostics.db.connected = db?.isConnected();
    diagnostics.db.latency = await (async () => {
      const s = Date.now();
      await db.query('SELECT 1');
      return Date.now() - s;
    })().catch(() => -1);
    diagnostics.db.status = diagnostics.db.latency >= 0 ? 'nominal' : 'degraded';

    // File System & Kernel Metrics
    const osInfo = {
      platform: os.platform(),
      totalMem: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
      freeMem: Math.round(os.freemem() / 1024 / 1024) + 'MB',
      load: os.loadavg()[0].toFixed(2)
    };

    const testFile = path.join(muServerPath, '.sentinel_test');
    fs.writeFileSync(testFile, 'sentinel_ping');
    fs.unlinkSync(testFile);
    
    diagnostics.fs.status = 'nominal';
    diagnostics.fs.muPath = muServerPath;
    diagnostics.fs.metrics = osInfo;

    diagnostics.ai.provider = "Google Gemini/Cortex";
    diagnostics.ai.status = 'nominal';
  } catch (err: any) {
    logger.error("[DEEP-HEALTH] Diagnostics failed", { error: err.message });
  }

  res.json({
    status: diagnostics.db.status === 'nominal' && diagnostics.fs.status === 'nominal' ? 'healthy' : 'degraded',
    latency: Date.now() - start,
    timestamp: new Date().toISOString(),
    diagnostics,
    session: {
      uptime: Math.round(process.uptime()) + 's',
      node: process.version
    }
  });
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
  if (!query) return res.status(400).json({ error: "Empty query" });
  
  const forbidden = ["DROP", "TRUNCATE", "DB_NAME", "MASTER..", "SHUTDOWN", "XP_CMDSHELL"];
  const upperQuery = query.toUpperCase();
  if (forbidden.some(word => upperQuery.includes(word))) {
    logger.warn(`[SECURITY] SQL Injection attempt blocked: ${query}`);
    return res.status(403).json({ error: "Forbidden SQL keyword/operation detected. Sentinel protocol engaged." });
  }

  try {
    const result = await db.query(query);
    res.json({ 
      success: true, 
      result: result.recordset, 
      rowsAffected: result.rowsAffected,
      executionPlan: "standard"
    });
  } catch (error: any) {
    logger.error("[DB-EXEC] Failed", { query, error: error.message });
    res.status(500).json({ 
      error: error.message,
      code: "SQL_EXEC_FAIL",
      hint: "Check table names and column existence."
    });
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

router.get("/mu/gs-status", async (req, res) => {
  try {
    const isWin = os.platform() === 'win32';
    const checkCmd = isWin ? 'tasklist /FI "IMAGENAME eq GameServer.exe"' : 'pgrep -f GameServer.exe';
    
    exec(checkCmd, (err, stdout) => {
      const isRunning = isWin 
        ? stdout.toLowerCase().includes("gameserver.exe")
        : (stdout && stdout.trim().length > 0);
        
      res.json({ 
        status: isRunning ? 'online' : 'offline',
        timestamp: new Date().toISOString()
      });
    });
  } catch (e: any) {
    res.json({ status: 'offline', error: e.message });
  }
});

// --- MuOnline Specific Data ---
router.get("/players", async (req, res) => {
  if (!db?.isConnected()) return res.status(500).json({ error: "DB not connected" });
  const cached = apiCache.get("players");
  if (cached) return res.json(cached);
  try {
    const result = await db.query(`SELECT TOP 100 Name, Class, cLevel, ResetCount, MapNumber, AccountID FROM Character ORDER BY cLevel DESC`);
    const data = { players: result.recordset };
    apiCache.set("players", data, 30000); // 30s cache
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/guilds", async (req, res) => {
  if (!db?.isConnected()) return res.status(500).json({ error: "DB not connected" });
  const cached = apiCache.get("guilds");
  if (cached) return res.json(cached);
  try {
    const result = await db.query(`SELECT TOP 50 G_Name as name, G_Master as master, G_Score as score FROM Guild ORDER BY G_Score DESC`);
    const data = { guilds: result.recordset };
    apiCache.set("guilds", data, 60000); // 60s cache
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/economy", async (req, res) => {
  if (!db?.isConnected()) return res.status(500).json({ error: "DB not connected" });
  const cached = apiCache.get("economy");
  if (cached) return res.json(cached);
  try {
    const result = await db.query(`SELECT SUM(CAST(Money as bigint)) as total FROM (SELECT Money FROM Character UNION ALL SELECT Money FROM warehouse)`);
    const data = { totalMoney: result.recordset?.[0]?.total || 0 };
    apiCache.set("economy", data, 60000); // 60s cache
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dashboard-stats", async (req, res) => {
  if (!db?.isConnected()) return res.json({ totalAccounts: 0, totalCharacters: 0, onlinePlayers: 0 });
  const cached = apiCache.get("dashboard-stats");
  if (cached) return res.json(cached);
  try {
    const [accs, chars, online] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM MEMB_INFO'),
      db.query('SELECT COUNT(*) as count FROM Character'),
      db.query('SELECT COUNT(*) as count FROM MEMB_STAT WHERE ConnectStat = 1').catch(() => ({ recordset: [{ count: 0 }] }))
    ]);
    const data = {
      totalAccounts: accs.recordset?.[0]?.count || 0,
      totalCharacters: chars.recordset?.[0]?.count || 0,
      onlinePlayers: online.recordset?.[0]?.count || 0
    };
    apiCache.set("dashboard-stats", data, 10000); // 10s cache
    res.json(data);
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
  const { query, includeSymbols } = req.query;
  if (!query || typeof query !== 'string') return res.status(400).json({ error: "Missing query" });

  try {
    const matches = await searchFiles(muServerPath, query, includeSymbols === 'true');
    res.json({ matches, success: true });
  } catch (err: any) {
    logger.error("[API-FILES-SEARCH] Failure", { error: err.message });
    res.status(500).json({ error: "Search failed", success: false });
  }
});

router.get("/files/autocomplete", async (req, res) => {
  const { query, filepath } = req.query;
  if (!query || typeof query !== 'string') return res.status(400).json({ error: "Missing query" });

  try {
    const symbols = new Set<string>();
    
    // 1. Local context: Extract symbols from current file if provided
    if (filepath && typeof filepath === 'string') {
      const fullPath = path.resolve(muServerPath, filepath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Simple regex for C++/Java symbols
        const regex = /\b(void|int|char|bool|float|double|class|struct)\s+([a-zA-Z_]\w*)\b|([a-zA-Z_]\w*)\s*\(/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const sym = match[2] || match[3];
          if (sym && sym.toLowerCase().includes(query.toLowerCase())) {
            symbols.add(sym);
          }
        }
      }
    }

    // 2. Global context: File paths
    const maxFiles = 20;
    const findFiles = (dir: string) => {
      if (symbols.size >= 50) return;
      if (!fs.existsSync(dir)) return;
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          if (symbols.size >= 50) break;
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
             if (item !== 'node_modules' && item !== '.git') findFiles(fullPath);
          } else {
            if (item.toLowerCase().includes(query.toLowerCase())) {
              symbols.add(item);
            }
          }
        }
      } catch (e) {}
    };

    findFiles(muServerPath);

    res.json({ suggestions: Array.from(symbols).slice(0, 30) });
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
  res.json({ 
    muServerPath, 
    connectionMode, 
    maintenanceMode,
    dbEngine,
    dbConfig: { ...dbConfig, password: '****' },
    sshConfig: { ...sshConfig, password: '****' } 
  });
});

router.post("/config", (req, res) => {
  const { muServerPath: newPath, mode, ssh, db: newDb, dbEngine: newEngine, cacheSize: newCache, bufferSize: newBuffer, maintenanceMode: newMaintenance } = req.body;
  
  if (newPath) muServerPath = newPath;
  if (mode) connectionMode = mode;
  if (newMaintenance !== undefined) maintenanceMode = newMaintenance;
  if (ssh) sshConfig = { ...sshConfig, ...ssh };
  if (newDb) dbConfig = { ...dbConfig, ...newDb };
  if (newEngine) dbEngine = newEngine;

  const currentCacheSize = newCache || configService.get().cacheSize;
  const currentBufferSize = newBuffer || configService.get().bufferSize;

  // Persist to disk
  configService.save({
    muServerPath,
    connectionMode,
    maintenanceMode,
    dbEngine,
    cacheSize: currentCacheSize,
    bufferSize: currentBufferSize,
    dbConfig: {
       user: dbConfig.user,
       server: dbConfig.server,
       database: dbConfig.database,
       options: dbConfig.options
    },
    sshConfig: {
       host: sshConfig.host,
       port: sshConfig.port,
       username: sshConfig.username
    }
  });

  if (newDb || newEngine) {
    connectDB();
  }

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
      1. Responda estritamente em Português do Brasil.
      2. Seja técnico, útil e focado em Mu Online (S6+).
      3. Se detectar intenção de consulta ao banco, sugira a query SQL.
      4. PRIORIZE A LEGIBILIDADE USANDO MARKDOWN RICH:
         - Use **Negrito** para enfatizar comandos, flags ou componentes.
         - Use *Itálico* para conceitos técnicos.
         - Use tabelas ou listas para organizar dados complexos.
         - Use blocos de código ( \`\`\`sql ou \`\`\`cpp ) EXATAMENTE para exemplos técnicos.
         - Use Headers (#) para estruturar a resposta.
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
      1. Responda estritamente em Português do Brasil.
      2. Seja técnico, útil e focado em Mu Online (S6+).
      3. Se detectar intenção de consulta ao banco, sugira a query SQL.
      4. PRIORIZE A LEGIBILIDADE USANDO MARKDOWN RICH:
         - Use **Negrito** para enfatizar comandos, flags ou componentes.
         - Use *Itálico* para conceitos técnicos.
         - Use tabelas ou listas para organizar dados complexos.
         - Use blocos de código ( \`\`\`sql ou \`\`\`cpp ) EXATAMENTE para exemplos técnicos.
         - Use Headers (#) para estruturar a resposta.
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
    if (!matches || matches.length === 0) return res.json({ matches: [], success: true });
    
    // Semantic ranking
    const aiResp = await aiEngine.generate({
      prompt: `User Query: "${query}"\nCandidate files: ${JSON.stringify(matches.map((m: any) => m.path))}`,
      systemInstruction: `You are a semantic file search ranker. Rank these file paths by relevance to the query. Return them as a JSON array of objects: [{ "path": "...", "relevance": number_0_to_1, "reason": "short_reason" }, ...], sorted by relevance descending. Return ONLY JSON.`,
      temperature: 0.1,
      responseType: 'json'
    });

    if (aiResp.success) {
      res.json({ matches: aiResp.content, success: true });
    } else {
      res.json({ matches, success: true });
    }
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

// --- Git Management ---
router.get("/git/log", async (req, res) => {
  exec('git log -n 20 --pretty=format:"%h|%an|%cr|%s"', { cwd: muServerPath }, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    const logs = stdout.split('\n').filter(Boolean).map(line => {
        const [hash, author, date, message] = line.split('|');
        return { hash, author, date, message };
    });
    res.json({ logs });
  });
});

router.post("/git/commit", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Missing message" });
  exec(`git add . && git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: muServerPath }, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, stdout });
  });
});

router.post("/git/revert", async (req, res) => {
  const { filepath } = req.body;
  if (!filepath) return res.status(400).json({ error: "Missing filepath" });
  exec(`git checkout -- "${filepath.replace(/"/g, '\\"')}"`, { cwd: muServerPath }, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

router.post("/ai/generate-snippet", async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: "Missing query" });
  }

  try {
    const aiResp = await aiEngine.generate({
      prompt: `Generate a code snippet for: ${query}`,
      systemInstruction: `
        You are a highly efficient code snippet generator for Mu Online C++ and general system tools.
        Generate the requested snippet. 
        Return ONLY the raw code, NO markdown, NO explanations, NO wrapping in code blocks.
      `,
      temperature: 0.1,
      responseType: 'text'
    });

    if (!aiResp.success) {
      return res.status(503).json({ error: aiResp.content, success: false });
    }

    res.json({ snippet: aiResp.content, success: true });
  } catch (error: any) {
    logger.error("[AI] Error generating snippet", { error: error.message });
    res.status(500).json({ error: "AI snippet generation failed", success: false });
  }
});

router.post("/ai/debug-prompt", async (req, res) => {
  const { prompt, response } = req.body;
  if (!prompt || !response) return res.status(400).json({ error: "Missing prompt or response" });

  try {
    const aiResp = await aiEngine.generate({
      prompt: `PROMPT: ${prompt}\n\nRESPONSE: ${response}`,
      systemInstruction: `
        Analyze the provided AI response for potential hallucinations, logical errors, or misinformation.
        Return EXACTLY a JSON string:
        {
          "hasIssues": boolean,
          "report": "Detailed analysis and suggestions for improvement"
        }
      `,
      temperature: 0.1,
      responseType: 'json'
    });

    if (!aiResp.success) return res.status(503).json({ error: aiResp.content });
    res.json({ ...aiResp.content, success: true });
  } catch (error: any) {
    logger.error("[AI-DEBUG] Analysis failure", { error: error.message });
    res.status(500).json({ error: "Analysis engine failure" });
  }
});

// Fallback for API
router.all("*", (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

export default router;
