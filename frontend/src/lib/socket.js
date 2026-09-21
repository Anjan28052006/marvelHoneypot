import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      transports: ['websocket', 'polling'],
    });

    if (import.meta.env.DEV) {
      socket.on('connect', () => {
        console.info('[SentinelAI] Socket connected', socket.id);
      });
      socket.on('disconnect', (reason) => {
        console.warn('[SentinelAI] Socket disconnected', reason);
      });
      socket.on('connect_error', (error) => {
        console.warn('[SentinelAI] Socket connect error', error.message);
      });
    }
  }
  return socket;
}
