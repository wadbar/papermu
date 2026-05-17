import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import apiRouter from './src/routes/api.routes';
import logger from './src/services/logger';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  logger.info("[SYSTEM] Initializing Supreme Omni-Engineer Architecture...");
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Security Hardening & Edge Shield (THE GUARDIAN)
  app.use(helmet({
    contentSecurityPolicy: false, // Vite requires unsafe-inline for HMR
    crossOriginEmbedderPolicy: false
  }));

  // Smart Anti-DDoS & Dynamic IP Ban implementation
  const banList = new Map<string, number>();
  const requestCounts = new Map<string, { count: number, resetAt: number }>();
  const WINDOW_MS = 10000; // 10s
  const MAX_REQS_PER_WINDOW = 200; 
  const BAN_DURATION_MS = 60000; // 1 min ban

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

     if (reqData.count > MAX_REQS_PER_WINDOW) {
        logger.error(`[SHIELD] DDoS threshold crossed! Banning IP: ${ip}`);
        banList.set(ip, now + BAN_DURATION_MS);
        return res.status(429).json({ error: "Muitas requisições. Mecanismo de defesa ativado." });
     }

     next();
  });

  // Request Logging Middleware (THE CTO)
  app.use((req, res, next) => {
    // Evita duplicar logs para /api, já que o apiRouter pode ter os próprios, 
    // mas garante observabilidade global
    if (!req.path.startsWith('/api/')) {
      const start = Date.now();
      res.on('finish', () => {
        logger.info(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${Date.now() - start}ms`);
      });
    }
    next();
  });
  
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Health Check & Telemetry
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(), 
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    });
  });

  // Mount API Router BEFORE Vite
  app.use("/api", apiRouter);

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

  const httpServer = http.createServer(app);

  // Auto-healing port binding
  const startListening = (port: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      const server = httpServer.listen(port, "0.0.0.0", () => {
        logger.info(`[SYSTEM] Ecosystem running securely on interface 0.0.0.0:${port}`);
        
        // --- THE CTO: REAL-TIME MESH PROTOCOL ---
        const io = new SocketIOServer(server, {
          cors: { origin: "*", methods: ["GET", "POST"] }
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
                   io.emit('economy:alert', {
                     type: 'CRITICAL',
                     message: 'Anomalia detectada na economia global: Inflação ou injeção massiva de Zen identificada (Possível Dupe). As ações da API de negociação podem ser suspensas cautelarmente.',
                     value: data.totalMoney
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
