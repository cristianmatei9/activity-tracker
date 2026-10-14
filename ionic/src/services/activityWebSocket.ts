export function connectActivityWebSocket(
    onActivityChanged: () => void
): WebSocket {
    const socket = new WebSocket('ws://localhost:3000');

    socket.onopen = () => {
        console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (
            message.type === 'activity_created' ||
            message.type === 'activity_updated'
        ) {
            onActivityChanged();
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