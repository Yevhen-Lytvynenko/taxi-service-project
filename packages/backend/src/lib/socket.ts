import type { SocketService } from '../services/socket.service';

let instance: SocketService | null = null;

export function setSocketService(s: SocketService) {
  instance = s;
}

export function getSocketService(): SocketService {
  if (!instance) throw new Error('SocketService not initialized');
  return instance;
}
