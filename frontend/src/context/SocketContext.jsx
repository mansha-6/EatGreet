import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useSettings } from './SettingsContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const { user } = useSettings();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // ONLY connect if user is authenticated
        // This speeds up initial Login page load by not blocking with socket handshake
        if (!user) {
            if (socket) {
                socket.close();
                setSocket(null);
            }
            return;
        }

        // Prefer explicit socket URL when provided.
        const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL || '';
        // Derive socket URL from VITE_API_BASE_URL or default to localhost
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
        let socketUrl = '';

        if (explicitSocketUrl.startsWith('http')) {
            socketUrl = explicitSocketUrl.replace(/\/$/, '');
        } else if (apiBaseUrl.startsWith('http')) {
            socketUrl = apiBaseUrl.replace('/api', '');
        } else if (apiBaseUrl.startsWith('/')) {
            // Relative path, use current origin
            socketUrl = window.location.origin;
        } else {
            // Fallback to localhost if nothing is set
            socketUrl = 'http://localhost:5001';
        }

        console.log('Attempting Socket Connection to:', socketUrl);

        const newSocket = io(socketUrl, {
            // Socket auth uses app tokens, not browser cookies.
            // Keep this false to avoid CORS wildcard + credentials conflicts.
            withCredentials: false,
            // Polling first avoids continuous websocket-only handshake failures on some hosts/proxies.
            transports: ['polling', 'websocket'],
            path: '/socket.io',
            reconnectionAttempts: 10,
            reconnectionDelay: 5000,
            reconnectionDelayMax: 10000,
            timeout: 20000, // Increased timeout to 20s
        });

        setSocket(newSocket);

        // Debug connection
        newSocket.on('connect', () => {
            console.log('Socket Connected:', newSocket.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket Connection Error:', err);
            const status = err?.context?.status;
            const message = String(err?.message || '');
            if (status === 404 || message.includes('404')) {
                console.error('Socket endpoint returned 404. Stopping further reconnect attempts.');
                newSocket.io.opts.reconnection = false;
                newSocket.close();
            }
        });

        return () => {
            newSocket.close();
        };
    }, [user]); // Re-run when user changes (login/logout)

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
