import { Socket, io } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private url: string;

  constructor(url: string = window.location.origin) {
    this.url = url;
  }

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(this.url, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });
      this.socket.on('connect', () => console.log('[WS] Connected'));
      this.socket.on('disconnect', () => console.log('[WS] Disconnected'));
    }
    return this.socket;
  }

  public getSocket(): Socket {
    return this.connect();
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const wsService = new WebSocketService();
export default wsService;
