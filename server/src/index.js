const express = require('express');
const cors = require('cors');

const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

function notifyClients(message) {
    wss.clients.forEach((client) => {
        if(client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    })
}

const activities = [
    {
        id: 1,
        title: 'Gym Workout',
        description: 'Upper body training',
        date: '2026-10-15',
        duration: 60,
        completed: false,
        location: 'Cluj-Napoca'
    },
    {
        id: 2,
        title: 'Study Session',
        description: 'Study for university',
        date: '2026-10-16',
        duration: 120,
        completed: false
    },
    {
        id: 3,
        title: 'Grocery Shopping',
        description: 'Buy groceries for the week',
        date: '2026-10-13',
        duration: 45,
        completed: true
    }
];

app.get('/activities', (req, res) => {
    res.json(activities);
});

app.get('/activities/:id', (req, res) => {
    const activity = activities.find(
        (activity) => activity.id === Number(req.params.id)
    );

    if (!activity) {
        return res.status(404).json({
           message: 'Activity not found'
        });
    }

    res.json(activity);
});

app.post('/activities', (req, res) => {
    const { title, description, date, duration, completed, location } = req.body;

    if (!title || !date || !Number.isFinite(Number(duration)) || Number(duration) <= 0) {
        return res.status(400).json({ message: 'Invalid activity data' });
    }

    const newActivity = {
        id: Math.max(0, ...activities.map(a => a.id)) + 1,
        title,
        description: description ?? '',
        date,
        duration: Number(duration),
        completed: completed === true,
        location: location ?? ''
    };

    activities.push(newActivity);
    notifyClients({
        type: 'activity_created',
        activity: newActivity
    });

    res.status(201).json(newActivity);
});

app.put('/activities/:id', (req, res) => {
    const activity = activities.find(
        a => a.id === Number(req.params.id)
    );

    if(!activity) {
        return res.status(404).json({message: 'Activity not found'});
    }

    const { title, description, date, duration, completed, location } = req.body;

    if (!title || !date || !Number.isFinite(Number(duration)) || Number(duration) <= 0) {
        return res.status(400).json({ message: 'Invalid activity data' });
    }

    Object.assign(activity, {
        title,
        description,
        date,
        duration,
        completed,
        location
    });
    notifyClients({
        type: 'activity_created',
        activity
    });

    res.json(activity);
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
