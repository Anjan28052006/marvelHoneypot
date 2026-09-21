import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';

export function useSocket() {
  const [connected, setConnected] = useState(() => getSocket().connected);
  const [lastError, setLastError] = useState(null);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      setLastError(null);
    };
    const onDisconnect = () => {
      setConnected(false);
    };
    const onError = (error) => {
      setConnected(false);
      setLastError(error?.message || 'Socket connection failed');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);
    setConnected(socket.connected);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
    };
  }, []);

  return { connected, lastError };
}
