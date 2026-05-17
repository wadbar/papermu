import sql from "mssql";
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from "path";
import { telemetry } from './telemetry.service';
import logger from './logger';
import { DatabaseResult } from '../types';

export abstract class DatabaseProvider {
  abstract connect(): Promise<void>;
  abstract close(): Promise<void>;
  abstract query(sqlStr: string): Promise<DatabaseResult>;
  abstract isConnected(): boolean;
}

export class SQLiteProvider extends DatabaseProvider {
  private db: Database | null = null;
  private sqlitePath = path.join(process.cwd(), 'muonline.db');

  async connect() {
    try {
      if (this.db) await this.db.close();
      this.db = await open({
        filename: this.sqlitePath,
        driver: sqlite3.Database
      });
      
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS Character (Name TEXT, Class INTEGER, cLevel INTEGER, ResetCount INTEGER, MapNumber INTEGER, MapPosX INTEGER, MapPosY INTEGER, CtlCode INTEGER, AccountID TEXT, Money INTEGER);
        CREATE TABLE IF NOT EXISTS MEMB_INFO (memb___id TEXT);
        CREATE TABLE IF NOT EXISTS Guild (G_Name TEXT, G_Master TEXT, G_Score INTEGER, G_Mark TEXT);
        CREATE TABLE IF NOT EXISTS MEMB_STAT (ConnectStat INTEGER);
        CREATE TABLE IF NOT EXISTS warehouse (Money INTEGER);
        CREATE TABLE IF NOT EXISTS MuCastle_DATA (MAP_SVR_GROUP INTEGER);
      `);

      const chars = await this.db.get('SELECT COUNT(*) as count FROM Character');
      if (chars.count === 0) {
        await this.db.exec(`
          INSERT INTO Character (Name, Class, cLevel, ResetCount, MapNumber, MapPosX, MapPosY, CtlCode, AccountID, Money) VALUES 
          ('Wadson', 1, 400, 150, 0, 135, 125, 8, 'admin', 500000000),
          ('TestPlayer', 16, 250, 2, 2, 200, 100, 0, 'testac', 30000);
          INSERT INTO MEMB_INFO (memb___id) VALUES ('admin'), ('testac');
          INSERT INTO Guild (G_Name, G_Master, G_Score, G_Mark) VALUES ('AdminTeam', 'Wadson', 1000, '');
          INSERT INTO MEMB_STAT (ConnectStat) VALUES (1), (0);
          INSERT INTO warehouse (Money) VALUES (1000000);
        `);
      }
      logger.info("[DB] SQLite connected and initialized.");
    } catch (err: any) {
      logger.error("[DB] SQLite connection failed", { error: err.message });
      throw err;
    }
  }

  async close() {
    if (this.db) await this.db.close();
    this.db = null;
  }

  isConnected() {
    return this.db !== null;
  }

  async query(queryStr: string): Promise<DatabaseResult> {
    if (!this.db) throw new Error("SQLite not connected");
    
    const start = Date.now();
    try {
      let sql = queryStr;
      const topMatch = sql.match(/SELECT\s+TOP\s+(\d+)/i);
      if (topMatch) {
        sql = sql.replace(topMatch[0], 'SELECT');
        sql += ` LIMIT ${topMatch[1]}`;
      }
      sql = sql.replace(/ISNULL\\\(/gi, 'IFNULL(');
      
      const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
      if (isSelect) {
        const rows = await this.db.all(sql);
        telemetry.logPerformance(Date.now() - start);
        return { recordset: rows };
      } else {
        const resp = await this.db.run(sql);
        telemetry.logPerformance(Date.now() - start);
        return { rowsAffected: [resp.changes || 0] };
      }
    } catch (e: any) {
      telemetry.errorCount++;
      telemetry.lastError = e.message;
      logger.error("[DB] SQLite query error", { query: queryStr, error: e.message });
      throw e;
    }
  }
}

export class MSSQLProvider extends DatabaseProvider {
  private pool: sql.ConnectionPool | null = null;
  
  constructor(private config: any) {
    super();
  }

  async connect() {
    try {
      if (this.pool) await this.pool.close();
      this.pool = await sql.connect(this.config);
      logger.info("[DB] MSSQL connected.");
    } catch (err: any) {
      logger.error("[DB] MSSQL connection failed", { error: err.message });
      throw err;
    }
  }

  async close() {
    if (this.pool) await this.pool.close();
    this.pool = null;
  }

  isConnected() {
    return this.pool !== null && this.pool.connected;
  }

  async query(queryStr: string): Promise<DatabaseResult> {
    if (!this.pool) throw new Error("MSSQL not connected");
    const start = Date.now();
    try {
      const result = await this.pool.request().query(queryStr);
      telemetry.logPerformance(Date.now() - start);
      return { recordset: result.recordset, rowsAffected: result.rowsAffected };
    } catch (e: any) {
      telemetry.errorCount++;
      telemetry.lastError = e.message;
      logger.error("[DB] MSSQL query error", { query: queryStr, error: e.message });
      throw e;
    }
  }
}
