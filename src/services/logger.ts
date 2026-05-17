import winston from 'winston';

// In-memory log store for API access
export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  metadata?: any;
}

export const logBuffer: LogEntry[] = [];
const MAX_BUFFER_SIZE = 1000;

const memoryStore = winston.format((info) => {
  const entry: LogEntry = {
    level: String(info.level),
    message: String(info.message),
    timestamp: String(info.timestamp || new Date().toISOString()),
    metadata: { ...info }
  };
  delete entry.metadata.level;
  delete entry.metadata.message;
  delete entry.metadata.timestamp;

  logBuffer.unshift(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) logBuffer.pop();
  return info;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    memoryStore(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export default logger;
