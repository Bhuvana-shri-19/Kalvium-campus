/**
 * Kalvium Campus Navigator & Request Processing Simulator
 * Express Application Configuration
 * 
 * Configures:
 *   - Express JSON & URL-encoded request body parsing
 *   - Development CORS configuration for the Vite frontend (http://localhost:5173)
 *   - Health check endpoint at /api/health
 *   - Academic API routers: navigation, processing, requests (and compatibility routes)
 *   - JSON 404 handler for undefined endpoints
 *   - Centralized error-handling middleware mounted last
 * 
 * Server listening and port binding is maintained separately in server.js.
 */

import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import navigationRoutes from './routes/navigationRoutes.js';
import processingRoutes from './routes/processingRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import architectureRoutes from './routes/architectureRoutes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

// 1. Development CORS for the Vite frontend
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Express JSON and URL-encoded body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Health Check & Root API Status Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Kalvium Campus Navigator & Request Processing Simulator API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    academicModules: [
      'DAA (Design & Analysis of Algorithms): BFS & DFS Campus Navigation',
      'COA (Computer Organization & Architecture): Hardware Pipeline Simulation',
      'FLAT (Formal Languages & Automata Theory): DFA Request Lifecycle Validation'
    ]
  });
});

// 4. Mount API Routers under /api
app.use('/api/navigation', navigationRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/requests', requestRoutes);

// Compatibility router mounts for existing frontend service calls
app.use('/api/workflow', workflowRoutes);
app.use('/api/architecture', architectureRoutes);

// 5. JSON 404 Handler for undefined routes
app.use(notFoundHandler);

// 6. Centralized Error-Handling Middleware mounted last
app.use(errorHandler);

export { app };
export default app;
