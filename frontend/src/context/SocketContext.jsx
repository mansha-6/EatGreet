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

        // Derive socket URL from VITE_API_BASE_URL or default to localhost
        // API_BASE_URL typically ends with /api, we need the root
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';
        const socketUrl = apiBaseUrl.replace('/api', '');

        console.log('Attempting Socket Connection to:', socketUrl);

        const newSocket = io(socketUrl, {
            withCredentials: true,
            transports: ['polling', 'websocket'], // Polling first for better compatibility, then upgrade
            reconnectionAttempts: Infinity,
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
