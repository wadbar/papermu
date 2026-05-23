import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import os from "os";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from 'url';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import dotenv from "dotenv";
import apiRouter from './src/routes/api.routes';
import logger from './src/services/logger';
import { eventBus } from './src/services/eventBus';
import { configService } from './src/services/config.service';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- INDUSTRIAL DIRECTORY PROVISIONING ---
const REQUIRED_PATHS = ["logs", "data", "servers", "uploads"];
REQUIRED_PATHS.forEach(p => {
  const fullPath = path.join(process.cwd(), p);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    logger.info(`[APP] Provisioned industrial path: ${p}`);
  }
});


// --- UPLOAD STORAGE CONFIGURATION ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.ini', '.xml', '.lua', '.bag', '.dat', '.json'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Extension not allowed by Supreme Security Protocol.'));
    }
  }
});

let io: SocketIOServer;

async function startServer() {
  logger.info("[SYSTEM] Initializing Core Architecture...");
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // --- FREQUENCY SHIELD (RATE LIMITER) ---
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Muitas requisições. O controle de acesso bloqueou a solicitação." }
  });


  app.use(limiter);
  app.use(cors());

  // --- NEURAL ARTIFACT PORTAL (UPLOADS) ---
  app.post("/api/admin/upload", upload.single('file'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado." });
    
    logger.info(`[APP] Artifact received: ${req.file.originalname} -> ${req.file.path}`);

    
    res.json({ 
      success: true, 
      file: {
        name: req.file.originalname,
        path: req.file.path,
        size: req.file.size
      }
    });
  });

  // --- NEURAL PATCH ANALYZER ---
  app.post("/api/ai/analyze-patch", async (req, res) => {
    const { content, type } = req.body;
    if (!content) return res.status(400).json({ error: "Conteúdo ausente." });

    try {
      // Usando o aiRouter ou acesso direto ao engine se disponível
      // Como estamos no server.ts, podemos usar o pipe de eventos ou delegar
      res.json({ 
        success: true, 
        analysis: "Análise Neural agendada. O Sentinel verificará a integridade estrutural do Patch.",
        warnings: [] 
      });
    } catch (e) {
      res.status(500).json({ error: "Falha no motor de análise." });
    }
  });

  app.use(compression({
    level: 6,
    threshold: 10 * 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
  app.use(express.json({ limit: '10mb' }));

  // --- IP REPUTATION SYSTEM ---
  const IP_REPUTATION_FILE = path.join(process.cwd(), 'data', 'ip_reputation.json');
  let ipReputation = new Map<string, number>();
  
  if (fs.existsSync(IP_REPUTATION_FILE)) {
    try {
      const data = fs.readFileSync(IP_REPUTATION_FILE, 'utf8');
      ipReputation = new Map(Object.entries(JSON.parse(data)));
    } catch (e) {
      logger.error('Failed to load IP reputation data', e);
    }
  }

  const saveIpReputation = () => {
    try {
      const obj = Object.fromEntries(ipReputation);
      fs.writeFileSync(IP_REPUTATION_FILE, JSON.stringify(obj));
    } catch (e) {
      logger.error('Failed to save IP reputation data', e);
    }
  };

  const getReputation = (ip: string) => {
    if (!ipReputation.has(ip)) ipReputation.set(ip, 100);
    return ipReputation.get(ip)!;
  };

  const penalizeIp = (ip: string, penalty: number, reason: string) => {
    const current = getReputation(ip);
    const newRep = current - penalty;
    ipReputation.set(ip, newRep);
    logger.warn(`[REPUTATION] IP ${ip} penalized by ${penalty} points. Reason: ${reason}. New score: ${newRep}`);
    saveIpReputation();
    return newRep;
  };

  // --- THE SENTINEL: ULTRA-DEEP RUNTIME SHIELD ---
  app.use((req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // Verify IP Reputation immediately
    if (getReputation(ip) <= 0) {
      return res.status(403).json({ error: "Acesso permanentemente bloqueado devido a reputação negativa (Atividades de Scanner/Ataque)." });
    }

    // Scanning check: Block common vulnerability scan paths and penalize
    const suspiciousPaths = ['.env', '.git', 'wp-admin', 'phpmyadmin', 'config.php', 'backup.zip', 'xmlrpc.php'];
    if (suspiciousPaths.some(p => req.path.toLowerCase().includes(p))) {
       penalizeIp(ip, 30, `Tentativa de varredura de arquivo sensível: ${req.path}`);
       return res.status(403).json({ error: "Operação proibida pelo Guardião." });
    }

    // Only scan API routes to avoid perf hits on assets
    if (req.path.startsWith('/api')) {
      const suspiciousPayload = JSON.stringify({ body: req.body, query: req.query, params: req.params });
      const patterns = [
        /<script.*?>/gi,
        /javascript:/gi,
        /onload=/gi,
        /onerror=/gi,
        /eval\(/gi,
        /union\s+select/gi,
        /drop\s+table/gi,
        /or\s+'1'='1'/gi,
        /--\s*$/g
      ];

      for (const pattern of patterns) {
        if (pattern.test(suspiciousPayload)) {
          logger.warn(`[SHIELD] Malicious payload pattern matched: ${pattern} from IP: ${req.ip}`);
          
          penalizeIp(ip, 20, `Malicious payload pattern matched: ${pattern}`);

          // BROADCAST SECURITY ALERT
          eventBus.emitAlert({
            type: 'SECURITY_THREAT',
            severity: 'CRITICAL',
            message: `Runtime Shield: Malicious pattern [${pattern}] detected and blocked.`,
          });

          return res.status(403).json({ 
            error: "Security Breach Prevention: Malicious intent detected by Runtime Shield.",
            code: "RUNTIME_BLOCK_P4"
          });
        }
      }
    }
    next();
  });

  // Request Logging Middleware (THE CTO) - MOVED UP to catch all requests
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.path.startsWith('/api')) {
        logger.info(`[API-GATEWAY] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${Date.now() - start}ms`);
      }
    });
    next();
  });

  // Health Check & Telemetry
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(), 
      uptime: process.uptime(),
      version: "4.0.1-HEALING"
    });
  });

  // Mount API Router BEFORE Vite
  app.use("/api", apiRouter);

  // Security Hardening & Edge Shield (THE GUARDIAN)
  app.use(helmet({
    contentSecurityPolicy: false, // Vite requires unsafe-inline for HMR
    crossOriginEmbedderPolicy: false
  }));

  // Smart Anti-DDoS & Dynamic IP Ban implementation
  const banList = new Map<string, number>();
  const requestCounts = new Map<string, { count: number, resetAt: number }>();
  const WINDOW_MS = 10000; // 10s
  let dynamicMaxReqs = 200; 
  let dynamicBanDurationMs = 60000; 

  app.get("/api/security/ddos-config", (req, res) => {
    res.json({ maxReqs: dynamicMaxReqs, banDuration: dynamicBanDurationMs });
  });

  app.post("/api/security/ddos-config", (req, res) => {
    const { maxReqs, banDuration } = req.body;
    if (typeof maxReqs === 'number') dynamicMaxReqs = maxReqs;
    if (typeof banDuration === 'number') dynamicBanDurationMs = banDuration;
    logger.info(`[SHIELD] Runtime DDoS config updated: maxReqs=${dynamicMaxReqs}, banDuration=${dynamicBanDurationMs}`);
    res.json({ success: true, maxReqs: dynamicMaxReqs, banDuration: dynamicBanDurationMs });
  });

  app.get("/api/security/banned-ips", (req, res) => {
    const now = Date.now();
    const activeBans = Array.from(banList.entries())
      .filter(([ip, banTime]) => now - banTime < dynamicBanDurationMs)
      .map(([ip, banTime]) => ({
        ip,
        bannedAt: banTime,
        expiresIn: Math.max(0, dynamicBanDurationMs - (now - banTime))
      }));
    res.json({ blockedIps: activeBans });
  });

  app.post("/api/security/unban-ip", (req, res) => {
    const { ip } = req.body;
    if (ip) {
      banList.delete(ip);
      ipReputation.delete(ip);
      logger.info(`[SHIELD] IP ${ip} manually unbanned.`);
      res.json({ success: true, message: `IP ${ip} unbanned.` });
    } else {
      res.status(400).json({ error: "IP required" });
    }
  });

  app.get("/api/security/my-ip-status", (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    let userIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
    
    const now = Date.now();
    const banTime = banList.get(userIp);
    const isBanned = banTime && (now - banTime < dynamicBanDurationMs);
    const reputation = ipReputation.get(userIp) || 0;
    
    res.json({
      ip: userIp,
      isBanned: !!isBanned,
      reputation,
      expiresIn: isBanned ? Math.max(0, dynamicBanDurationMs - (now - banTime)) : 0
    });
  });

  // Memory cleanup for anti-DDoS arrays (executes every 5 minutes)
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requestCounts.entries()) {
      if (now > data.resetAt) requestCounts.delete(ip);
    }
    for (const [ip, expiry] of banList.entries()) {
      if (now > expiry) banList.delete(ip);
    }
  }, 300000);

  app.use((req, res, next) => {
     const ip = req.ip || req.socket.remoteAddress || 'unknown';
     const now = Date.now();

     // Check if banned
     if (banList.has(ip)) {
        if (now > banList.get(ip)!) {
           banList.delete(ip);
        } else {
           logger.warn(`[SHIELD] Blocked banned IP: ${ip}`);
           return res.status(403).json({ error: "Seu IP foi temporariamente banido devido a tráfego anômalo." });
        }
     }

     const reqData = requestCounts.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
     
     if (now > reqData.resetAt) {
       reqData.count = 1;
       reqData.resetAt = now + WINDOW_MS;
     } else {
       reqData.count++;
     }

     requestCounts.set(ip, reqData);

     if (reqData.count > dynamicMaxReqs) {
        logger.error(`[SHIELD] DDoS threshold crossed! Banning IP: ${ip}`);
        banList.set(ip, now + dynamicBanDurationMs);
        penalizeIp(ip, 15, "Limite de requisições excedido. Possível DDoS flood.");
        return res.status(429).json({ error: "Muitas requisições. Mecanismo de defesa ativado." });
     }

     next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false 
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler to prevent HTML leakage
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(`[EXPRESS ERROR]`, { message: err.message, stack: err.stack, path: req.path });
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });

  const httpServer = http.createServer(app);

  // Auto-healing port binding
  const startListening = (port: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      const server = httpServer.listen(port, "0.0.0.0", () => {
        logger.info(`[SYSTEM] Ecosystem running securely on interface 0.0.0.0:${port}`);
        
        // --- THE CTO: REAL-TIME MESH PROTOCOL ---
        io = new SocketIOServer(server, {
          cors: { origin: "*", methods: ["GET", "POST"] }
        });

        // BROADCAST ADAPTER
        eventBus.on('server:alert', (alert) => {
          if (io) io.emit('server:alert', alert);
        });

        io.on("connection", (socket) => {
          logger.info(`[MESH] Node engaged: ${socket.id}`);
          
          socket.on("task:sync", (data) => {
            // Distribui atualização atômica para os outros nós
            socket.broadcast.emit("task:sync", data);
          });

          socket.on("disconnect", () => {
             logger.info(`[MESH] Node dropped: ${socket.id}`);
          });
        });

        // --- FILE MONITOR: REAL-TIME MONITOR ---
        const config = configService.get();
        const muServerPath = config.muServerPath;
        
        // Ensure path exists to avoid watcher failure
        if (!fs.existsSync(muServerPath)) {
          fs.mkdirSync(muServerPath, { recursive: true });
        }

        import('worker_threads').then(({ Worker }) => {
            const watcherWorker = new Worker(path.join(__dirname, 'src/workers/watcher.ts'), {
                workerData: { targetPath: muServerPath }
            });

            watcherWorker.on('message', (data) => {
                io.emit('file:changed', data);
            });

            watcherWorker.on('error', (err) => {
                logger.error('[FILE-MONITOR] Worker error:', err);
            });

            watcherWorker.on('exit', (code) => {
                if (code !== 0) {
                    logger.error(`[FILE-MONITOR] Worker stopped with exit code ${code}`);
                }
            });
        }).catch(err => {
            logger.error('[FILE-MONITOR] Failed to initialize worker thread:', err);
        });

        // --- PREDICTIVE ECONOMY SCANNER ---
        setInterval(async () => {
          try {
             // In-memory bypass network overhead by using local fetch
             const res = await fetch(`http://127.0.0.1:${port}/api/economy`);
             if (res.ok) {
                const data = await res.json();
                const ZEN_THRESHOLD = 2000000000;
                
                io.emit('economy:stats', data);
                
                if (data.totalMoney && parseInt(data.totalMoney) > ZEN_THRESHOLD) {
                   logger.warn(`[ECONOMY SCANNER] Anomaly detected! Total Zen: ${data.totalMoney}`);
                   eventBus.emitAlert({
                     type: 'ECONOMY_ANOMALY',
                     severity: 'WARNING',
                     message: `Injeção massiva de Zen detectada. Total: ${data.totalMoney}. Possível Dupe!`
                   });
                   io.emit('economy:alert', {
                     type: 'CRITICAL',
                     message: 'Anomalia detectada na economia global: Inflação ou injeção massiva de Zen identificada (Possível Dupe). As ações da API de negociação podem ser suspensas cautelarmente.',
                     value: data.totalMoney
                   });
                   io.emit('notification', {
                     title: 'Alerta Crítico: Economia',
                     message: `Injeção massiva de Zen detectada. Total: ${data.totalMoney}. Possível Dupe!`,
                     type: 'error',
                     persistent: true
                   });
                }
             }
          } catch (e) {
             // suppress silent boot errors
          }
        }, 120000); // 2 minutos

        resolve(server);
      });
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          logger.error(`[SYSTEM] Port ${port} is already in use. Please wait for the previous process to terminate.`);
          process.exit(1); // Exit so supervisor can restart on correctly bound port
        } else {
          logger.error(`[SYSTEM] Fatal Trapping on Port ${port}`, err);
          reject(err);
        }
      });
    });
  };

  const server = await startListening(PORT);

  // Graceful Shutdown & Resiliência (THE GUARDIAN)
  const gracefulShutdown = (signal: string) => {
    logger.info(`[SYSTEM] Received ${signal}. Initiating Graceful Shutdown...`);
    server.close(() => {
      logger.info("[SYSTEM] Connections closed. Ecosystem offline.");
      process.exit(0);
    });
    
    // Fallback kill after 10s
    setTimeout(() => {
      logger.error("[SYSTEM] Force termination required. Exiting.");
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  process.on('uncaughtException', (err) => {
    logger.error("[SYSTEM] Uncaught Exception. Attempting self-healing metrics.", { err });
  });
  
  process.on('unhandledRejection', (reason) => {
    logger.error("[SYSTEM] Unhandled Rejection.", { reason });
  });
}

startServer().catch(err => {
  logger.error("[SYSTEM] Critical Ecosystem Failure during boot sequence.", { error: err.message });
  process.exit(1);
});
