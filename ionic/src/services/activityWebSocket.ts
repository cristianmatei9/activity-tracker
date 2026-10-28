
import { getToken } from './authApi';

export function connectActivityWebSocket(
    onActivityChanged: () => void
): WebSocket {
    const token = getToken();

    const socket = new WebSocket(
        `ws://localhost:3000?token=${encodeURIComponent(token || '')}`
    );

    socket.onopen = () => {
        console.log('WebSocket connected');
    };

    socket.onmessage = event => {
        try {
            const message = JSON.parse(event.data);

            if (
                message.type === 'activity_created' ||
                message.type === 'activity_updated'
            ) {
                onActivityChanged();
            }
        } catch {
            console.error('Invalid WebSocket message');
        }
    };

    socket.onerror = () => {
        console.error('WebSocket error');
    };

    socket.onclose = () => {
        console.log('WebSocket disconnected');
    };

    return socket;
}
