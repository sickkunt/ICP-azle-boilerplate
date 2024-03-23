import express from 'express';
import { Server, StableBTreeMap, ic } from 'azle';
import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a travel-related message that can be listed on the platform.
 */
interface TravelMessage {
    id: string;
    title: string;
    body: string;
    location: string;
    startDate: Date;
    endDate: Date;
    creatorId: string; // ID of the user who created the message
    createdAt: Date;
    updatedAt: Date | null;
}

// Storage for travel messages
const travelMessagesStorage = StableBTreeMap<string, TravelMessage>(0);

// Create an Express application
const app = express();
app.use(express.json());

// Middleware for error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

// Endpoint to create a new travel message
app.post('/travel-messages', (req, res) => {
    try {
        const { title, body, location, startDate, endDate, creatorId } = req.body;
        if (!title || !body || !location || !startDate || !endDate || !creatorId) {
            throw new Error('Missing required fields');
        }
        const id = uuidv4();
        const createdAt = getCurrentDate();
        const newTravelMessage: TravelMessage = { id, title, body, location, startDate, endDate, creatorId, createdAt, updatedAt: null };
        travelMessagesStorage.insert(id, newTravelMessage);
        res.json(newTravelMessage);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Endpoint to get all travel messages
app.get('/travel-messages', (req, res) => {
    res.json(travelMessagesStorage.values());
});

// Endpoint to get a specific travel message by ID
app.get('/travel-messages/:id', (req, res) => {
    const messageId = req.params.id;
    const travelMessage = travelMessagesStorage.get(messageId);
    if (!travelMessage) {
        res.status(404).send(`Travel message with ID=${messageId} not found`);
    } else {
        res.json(travelMessage);
    }
});

// Endpoint to update a travel message
app.put('/travel-messages/:id', (req, res) => {
    const messageId = req.params.id;
    const { title, body, location, startDate, endDate, creatorId } = req.body;
    const travelMessage = travelMessagesStorage.get(messageId);
    if (!travelMessage) {
        res.status(404).send(`Travel message with ID=${messageId} not found`);
    } else {
        try {
            if (!title || !body || !location || !startDate || !endDate || !creatorId) {
                throw new Error('Missing required fields');
            }
            const updatedAt = getCurrentDate();
            const updatedTravelMessage: TravelMessage = { ...travelMessage, title, body, location, startDate, endDate, creatorId, updatedAt };
            travelMessagesStorage.insert(messageId, updatedTravelMessage);
            res.json(updatedTravelMessage);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
});

// Endpoint to delete a travel message
app.delete('/travel-messages/:id', (req, res) => {
    const messageId = req.params.id;
    const deletedTravelMessage = travelMessagesStorage.remove(messageId);
    if (!deletedTravelMessage) {
        res.status(404).send(`Travel message with ID=${messageId} not found`);
    } else {
        res.json(deletedTravelMessage);
    }
});

// Function to get the current date
function getCurrentDate(): Date {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}

// Start the server
export default Server(() => app.listen());
