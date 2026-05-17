import { EventEmitter } from 'events';

class GlobalEventBus extends EventEmitter {
  emitAlert(alert: { type: string, severity: 'CRITICAL' | 'WARNING' | 'INFO', message: string, timestamp?: string }) {
    this.emit('server:alert', {
      ...alert,
      timestamp: alert.timestamp || new Date().toISOString()
    });
  }
}

export const eventBus = new GlobalEventBus();
