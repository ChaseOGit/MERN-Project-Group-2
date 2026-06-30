const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const app = express();

// Middleware: Fulfills your JSON requirement & allows Cross-Origin requests
app.use(cors());
app.use(express.json());

// Swagger Configuration (Fulfills your Swagger requirement)
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'MERN Group 2 API',
            version: '1.0.0',
            description: 'API documentation for our MERN project',
        },
        servers: [
            { url: 'http://localhost:5000' }
        ],
    },
    apis: ['./server.js'], // Typically you point this to a routes folder
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Returns the status of the API
 *     responses:
 *       200:
 *         description: API is running smoothly
 */
app.get('/api/status', (req, res) => {
    res.json({ message: "API is working perfectly!", success: true });
});

const deviceRoutes = require('./routes/deviceRoutes');
app.use('/api/devices', deviceRoutes);

const connectDB = require('./config/Db'); // Import your teammate's file

// Connect to the database
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
    console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});