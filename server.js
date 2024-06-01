const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8090 });

let clients = [];
let userId = 0;

wss.on('connection', (ws) => {
    userId += 1;
    ws.id = userId;
    clients.push(ws);
    
    ws.on('message', (message) => {
        const messageData = prepareMessage(message, ws);
        if (messageData.username) {
            ws.username = messageData.username;
            ws.send(JSON.stringify({ online: getOnlineUsers() }));
        }
        messageData.online = getOnlineUsers();
        sendToAllClients(JSON.stringify(messageData), ws);
    });

    ws.on('close', () => {
        clients = clients.filter(client => client !== ws);
        const msgToSend = `${ws.username} has disconnected`;
        const data = { type: 'logout', message: msgToSend, online: getOnlineUsers() };
        sendToAllClients(JSON.stringify(data), ws);
    });
});

function prepareMessage(message, ws) {
    const receivedData = JSON.parse(message);
    let data = {};

    if (receivedData.login && receivedData.username) {
        const username = receivedData.username;
        const msgToSend = `${username} has joined`;
        data = { username, message: msgToSend, type: 'login' };
    } else if (receivedData.body) {
        data = { message: receivedData.body, type: 'chat' };
    }

    return data;
}

function sendToAllClients(message, excludeClient) {
    clients.forEach(client => {
        if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function getOnlineUsers() {
    return clients.map(client => client.username);
}

console.log("--- server started on ws://localhost:8090");
