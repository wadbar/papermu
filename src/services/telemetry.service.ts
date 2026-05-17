import logger from './logger';

class TelemetryService {
  private dbLatency: number[] = [];
  public requestCount: number = 0;
  public errorCount: number = 0;
  public lastError: string | null = null;
  public activeConnections: number = 0;
  public webhooks: string[] = [];

  logPerformance(latency: number) {
    this.dbLatency.push(latency);
    if (this.dbLatency.length > 100) this.dbLatency.shift();
  }

  async notify(event: string, data: any) {
    logger.info(`[EVENT] ${event}`, { data });
    for (const url of this.webhooks) {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
        });
      } catch (e: any) {
        logger.error(`[Webhook Error] Failed to notify ${url}`, { error: e.message });
      }
    }
  }

  getMetrics() {
    const avgLatency = this.dbLatency.length > 0 
      ? this.dbLatency.reduce((a, b) => a + b, 0) / this.dbLatency.length 
      : 0;
    return {
      avgLatency: avgLatency.toFixed(2) + 'ms',
      errorRate: ((this.errorCount / (this.requestCount || 1)) * 100).toFixed(2) + '%',
      activeConnections: this.activeConnections,
      webhookCount: this.webhooks.length
    };
  }
}

export const telemetry = new TelemetryService();
