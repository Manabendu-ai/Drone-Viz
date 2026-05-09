const WebSocket = require('ws');

// Replace with FRIEND LAPTOP IP
const ws = new WebSocket('ws://10.172.68.220');

ws.on('open', () => {
    console.log('Connected to Drone Laptop');
});

ws.on('close', () => {
    console.log('Connection closed');
});

ws.on('error', (err) => {
    console.error('WebSocket Error:', err.message);
});

function sendDroneCommand(command) {

    if (ws.readyState === WebSocket.OPEN) {

        const payload = {
            command: command
        };

        ws.send(JSON.stringify(payload));

        console.log('Sent:', payload);

    } else {

        console.log('WebSocket not connected');

    }
}

module.exports = sendDroneCommand;
