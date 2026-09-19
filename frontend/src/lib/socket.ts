import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  const envSocket = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envSocket && envSocket.trim() !== '') {
    return envSocket.trim().replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return origin;
    }
  }
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
  }
  return socket;
};
