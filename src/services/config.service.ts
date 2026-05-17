import fs from 'fs';
import path from 'path';
import os from 'os';
import logger from './logger';

const CONFIG_FILE = path.join(process.cwd(), 'server_config.json');

interface AppConfig {
  muServerPath: string;
  dbEngine: 'mssql' | 'sqlite';
  connectionMode: 'local' | 'remote';
  maintenanceMode: boolean;
  cacheSize: number;
  bufferSize: number;
  dbConfig: {
    user: string;
    server: string;
    database: string;
    options: any;
  };
  sshConfig: {
    host: string;
    port: number;
    username: string;
  };
}

const defaultConfig: AppConfig = {
  muServerPath: process.env.MUSERVER_PATH || (os.platform() === 'win32' ? "C:\\MuServer" : "/mnt/c/MuServer"),
  dbEngine: 'sqlite',
  connectionMode: 'local',
  maintenanceMode: false,
  cacheSize: 256,
  bufferSize: 1024,
  dbConfig: {
    user: 'sa',
    server: process.env.DB_HOST || 'localhost',
    database: 'MuOnline',
    options: { encrypt: false, trustServerCertificate: true }
  },
  sshConfig: {
    host: '',
    port: 22,
    username: 'Administrator'
  }
};

class ConfigService {
  private config: AppConfig;

  constructor() {
    this.config = { ...defaultConfig };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        const parsed = JSON.parse(data);
        this.config = { ...defaultConfig, ...parsed };
        logger.info("[CONFIG] Persistent settings loaded.");
      }
    } catch (err: any) {
      logger.error("[CONFIG] Failed to load settings", { error: err.message });
    }
  }

  save(newConfig: Partial<AppConfig>) {
    try {
      // Don't save passwords in this file for security in this mock, 
      // but in a real app you'd use a secret manager or encrypted storage.
      this.config = { ...this.config, ...newConfig };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
      logger.info("[CONFIG] Settings saved to disk.");
      return true;
    } catch (err: any) {
      logger.error("[CONFIG] Failed to save settings", { error: err.message });
      return false;
    }
  }

  get() {
    return this.config;
  }
}

export const configService = new ConfigService();
