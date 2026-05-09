import { io } from 'socket.io-client';

class SocketService {
  socket = null;
  listeners = new Map();

  connect() {
    if (this.socket?.connected) return;
    this.socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:5000', { transports: ['websocket'] });
    this.socket.on('connect', () => console.log('Socket connected'));
    this.socket.on('disconnect', () => console.log('Socket disconnected'));
  }

  disconnect() { this.socket?.disconnect(); }

  on(event, callback) {
    this.socket?.on(event, callback);
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
  }

  off(event, callback) { this.socket?.off(event, callback); }

  emit(event, data) { this.socket?.emit(event, data); }

  joinRoom(userId) { this.emit('join_room', userId); }
}

export const socketService = new SocketService();
