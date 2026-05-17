import { Client } from "ssh2";
import logger from './logger';
import { SSHConfig } from '../types';

export class SSHService {
  constructor(private config: SSHConfig) {}

  executeRemote(cmd: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      const tid = setTimeout(() => {
        conn.end();
        reject(new Error("SSH Connection Timeout (15s)"));
      }, 15000);

      conn.on('ready', () => {
        logger.info(`[SSH] Executing: ${cmd}`);
        conn.exec(cmd, (err, stream) => {
          if (err) {
            clearTimeout(tid);
            conn.end();
            return reject(err);
          }
          let stdoutStr = '';
          let stderrStr = '';
          stream.on('close', (code: number, signal: string) => {
            clearTimeout(tid);
            conn.end();
            logger.info(`[SSH] Closed with code ${code}`);
            resolve({ stdout: stdoutStr, stderr: stderrStr });
          })
            .on('data', (data: any) => stdoutStr += data.toString())
            .stderr.on('data', (data: any) => stderrStr += data.toString());
        });
      })
        .on('error', (err) => {
          clearTimeout(tid);
          conn.end();
          logger.error("[SSH] Error", { error: err.message });
          reject(err);
        })
        .connect(this.config);
    });
  }

  sftpOperation(operation: 'read' | 'write', filepath: string, content?: string): Promise<string | void> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      const tid = setTimeout(() => {
        conn.end();
        reject(new Error("SFTP Connection Timeout (15s)"));
      }, 15000);

      conn.on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) {
            clearTimeout(tid);
            conn.end();
            return reject(err);
          }

          const windowsToLinuxPath = filepath.replace(/\\/g, '/');

          if (operation === 'read') {
            logger.info(`[SFTP] Reading: ${windowsToLinuxPath}`);
            sftp.readFile(windowsToLinuxPath, 'utf8', (err, data) => {
              clearTimeout(tid);
              conn.end();
              if (err) reject(err); else resolve(data.toString());
            });
          } else if (operation === 'write') {
            logger.info(`[SFTP] Writing: ${windowsToLinuxPath}`);
            sftp.writeFile(windowsToLinuxPath, content || '', 'utf8', (err) => {
              clearTimeout(tid);
              conn.end();
              if (err) reject(err); else resolve();
            });
          } else {
            clearTimeout(tid);
            conn.end();
            reject(new Error("Unsupported SFTP operation"));
          }
        });
      })
        .on('error', (err) => {
          clearTimeout(tid);
          conn.end();
          logger.error("[SFTP] Error", { error: err.message });
          reject(err);
        })
        .connect(this.config);
    });
  }
}
