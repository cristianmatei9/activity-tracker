
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from .env');
}

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({
    noServer: true
});

const users = [
    {
        id: 1,
        username: 'user1',
        passwordHash: bcrypt.hashSync('password123', 10)
    },
    {
        id: 2,
        username: 'user2',
        passwordHash: bcrypt.hashSync('password456', 10)
    }
];

function verifyUser(token) {
    const payload = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256']
    });

    return users.find(user => user.id === payload.userId);
}

server.on('upgrade', (request, socket, head) => {
    try {
        const url = new URL(
            request.url,
            `http://${request.headers.host}`
        );

        const token = url.searchParams.get('token');

        if (!token) {
            throw new Error('Missing token');
        }

        const user = verifyUser(token);

        if (!user) {
            throw new Error('Invalid user');
        }

        wss.handleUpgrade(request, socket, head, ws => {
            ws.userId = user.id;
            wss.emit('connection', ws, request);
        });
    } catch {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
    }
});

wss.on('connection', ws => {
    console.log(`WebSocket connected: user ${ws.userId}`);

    ws.on('close', () => {
        console.log(`WebSocket disconnected: user ${ws.userId}`);
    });
});

function notifyUser(userId, message) {
    wss.clients.forEach(client => {
        if (
            client.readyState === WebSocket.OPEN &&
            client.userId === userId
        ) {
            client.send(JSON.stringify(message));
        }
    });
}

app.post('/login', async (req, res) => {
    const { username, password } = req.body ?? {};

    if (
        typeof username !== 'string' ||
        typeof password !== 'string'
    ) {
        return res.status(400).json({
            message: 'Username and password are required'
        });
    }

    const user = users.find(u => u.username === username);

    if (
        !user ||
        !(await bcrypt.compare(password, user.passwordHash))
    ) {
        return res.status(401).json({
            message: 'Invalid credentials'
        });
    }

    const token = jwt.sign(
        { userId: user.id },
        JWT_SECRET,
        { expiresIn: '2h' }
    );

    res.json({
        token,
        user: {
            id: user.id,
            username: user.username
        }
    });
});

function authenticateToken(req, res, next) {
    const authorization = req.headers.authorization;

    const token = authorization?.startsWith('Bearer ')
        ? authorization.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({
            message: 'Authentication required'
        });
    }

    try {
        const user = verifyUser(token);

        if (!user) {
            return res.status(401).json({
                message: 'Invalid user'
            });
        }

        req.user = {
            id: user.id,
            username: user.username
        };

        next();
    } catch {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
}


const activities = [
    {
        id: 1, userId: 1,
        title: 'Gym Workout',
        description: 'Upper body training',
        date: '2026-10-15',
        duration: 60,
        completed: false,
        location: 'Cluj-Napoca'
    },
    {
        id: 2, userId: 1,
        title: 'Study Session',
        description: 'Study for university',
        date: '2026-10-16',
        duration: 120,
        completed: false
    },
    {
        id: 3, userId: 2,
        title: 'Grocery Shopping',
        description: 'Buy groceries for the week',
        date: '2026-10-13',
        duration: 45,
        completed: true
    },
    {
        id: 4, userId: 1,
        title: 'Morning Run',
        description: 'Running in the park',
        date: '2026-10-17',
        duration: 35,
        completed: true
    },
    {
        id: 5, userId: 1,
        title: 'Read a Book',
        description: 'Read 30 pages',
        date: '2026-10-18',
        duration: 45,
        completed: false
    },
    {
        id: 6, userId: 1,
        title: 'Team Meeting',
        description: 'Discuss project progress',
        date: '2026-10-19',
        duration: 60,
        completed: true
    },
    {
        id: 7, userId: 1,
        title: 'Cycling',
        description: 'Cycling around the city',
        date: '2026-10-20',
        duration: 90,
        completed: false
    },
    {
        id: 8, userId: 1,
        title: 'Java Practice',
        description: 'Practice backend development',
        date: '2026-10-21',
        duration: 120,
        completed: true
    },
    {
        id: 9, userId: 1,
        title: 'Swimming',
        description: 'Swimming pool training',
        date: '2026-10-22',
        duration: 60,
        completed: false
    },
    {
        id: 10, userId: 1,
        title: 'Cook Dinner',
        description: 'Prepare a healthy meal',
        date: '2026-10-23',
        duration: 50,
        completed: true
    },
    {
        id: 11, userId: 1,
        title: 'Database Project',
        description: 'Work on PostgreSQL queries',
        date: '2026-10-24',
        duration: 150,
        completed: false
    },
    {
        id: 12, userId: 1,
        title: 'Evening Walk',
        description: 'Walk around the neighborhood',
        date: '2026-10-25',
        duration: 40,
        completed: true
    },
    {
        id: 13, userId: 1,
        title: 'Clean Apartment',
        description: 'Weekly cleaning',
        date: '2026-10-26',
        duration: 75,
        completed: false
    },
    {
        id: 14, userId: 1,
        title: 'Algorithms Practice',
        description: 'Solve algorithm problems',
        date: '2026-10-27',
        duration: 90,
        completed: true
    },
    {
        id: 15, userId: 1,
        title: 'Project Planning',
        description: 'Plan upcoming tasks',
        date: '2026-10-28',
        duration: 60,
        completed: false
    },
    {
        id: 16, userId: 1,
        title: 'Weekend Hiking',
        description: 'Hiking trip in the mountains',
        date: '2026-10-29',
        duration: 180,
        completed: false
    }
];


app.use('/activities', authenticateToken);


app.get('/activities', (req, res) => {
    let userActivities = activities.filter(
        activity => activity.userId === req.user.id
    );

    const hasPagination =
        req.query.limit !== undefined ||
        req.query.offset !== undefined;

    // Keep the original endpoint for offline caching.
    if (!hasPagination) {
        return res.json(userActivities);
    }

    const limit = Number(req.query.limit ?? 10);
    const offset = Number(req.query.offset ?? 0);

    if (
        !Number.isInteger(limit) ||
        !Number.isInteger(offset) ||
        limit < 1 ||
        limit > 100 ||
        offset < 0
    ) {
        return res.status(400).json({
            message: 'Invalid pagination parameters'
        });
    }

    const search = String(req.query.search ?? '')
        .trim()
        .toLowerCase();

    const completed = req.query.completed;

    if (search) {
        userActivities = userActivities.filter(activity =>
            activity.title.toLowerCase().includes(search) ||
            activity.description.toLowerCase().includes(search)
        );
    }

    if (completed === 'true' || completed === 'false') {
        const isCompleted = completed === 'true';

        userActivities = userActivities.filter(
            activity => activity.completed === isCompleted
        );
    }

    res.json({
        items: userActivities.slice(offset, offset + limit),
        total: userActivities.length
    });
});


app.get('/activities/:id', (req, res) => {
    const activity = activities.find(
        activity =>
            activity.id === Number(req.params.id) &&
            activity.userId === req.user.id
    );

    if (!activity) {
        return res.status(404).json({
            message: 'Activity not found'
        });
    }

    res.json(activity);
});

function validateActivity(data) {
    return (
        typeof data.title === 'string' &&
        data.title.trim().length > 0 &&
        typeof data.date === 'string' &&
        data.date.trim().length > 0 &&
        Number.isFinite(Number(data.duration)) &&
        Number(data.duration) > 0
    );
}

function activityFields(data) {
    return {
        title: data.title,
        description: data.description ?? '',
        date: data.date,
        duration: Number(data.duration),
        completed: data.completed === true,
        location: data.location ?? ''
    };
}

app.post('/activities', (req, res) => {
    const data = req.body ?? {};

    if (!validateActivity(data)) {
        return res.status(400).json({
            message: 'Invalid activity data'
        });
    }

    const newActivity = {
        id: Math.max(0, ...activities.map(a => a.id)) + 1,
        userId: req.user.id,
        ...activityFields(data)
    };

    activities.push(newActivity);

    notifyUser(req.user.id, {
        type: 'activity_created',
        activity: newActivity
    });

    res.status(201).json(newActivity);
});

app.put('/activities/:id', (req, res) => {
    const activity = activities.find(
        a =>
            a.id === Number(req.params.id) &&
            a.userId === req.user.id
    );

    if (!activity) {
        return res.status(404).json({
            message: 'Activity not found'
        });
    }

    const data = req.body ?? {};

    if (!validateActivity(data)) {
        return res.status(400).json({
            message: 'Invalid activity data'
        });
    }

    Object.assign(activity, activityFields(data));

    notifyUser(req.user.id, {
        type: 'activity_updated',
        activity
    });

    res.json(activity);
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
