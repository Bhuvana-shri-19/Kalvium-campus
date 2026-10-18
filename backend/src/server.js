/**
 * Kalvium Campus Navigator & Request Processing Simulator
 * Server Entry Point
 * 
 * Responsibilities:
 *   1. Load environment configuration via dotenv & config module
 *   2. Import configured Express application from app.js
 *   3. Start HTTP server on process.env.PORT or port 5000
 *   4. Log local network address and health check URI
 *   5. Handle server startup errors (e.g. EADDRINUSE, EACCES) clearly
 * 
 * Strictly contains NO route definitions or business logic.
 */

import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import { config } from './config/env.js';

const PORT = Number(process.env.PORT) || Number(config?.port) || 5000;
const NODE_ENV = process.env.NODE_ENV || config?.nodeEnv || 'development';

const server = app.listen(PORT, () => {
  const address = `http://localhost:${PORT}`;
  console.log(`[Kalvium Simulator] Server running at: ${address} (${NODE_ENV})`);
  console.log(`[Kalvium Simulator] Health check endpoint: ${address}/api/health`);
});

// Handle startup errors gracefully
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[Kalvium Simulator Startup Error] Port ${PORT} is already in use. Please free the port or specify another PORT.`);
  } else if (error.code === 'EACCES') {
    console.error(`[Kalvium Simulator Startup Error] Port ${PORT} requires elevated administrative permissions.`);
  } else {
    console.error(`[Kalvium Simulator Startup Error] Failed to start server:`, error.message);
  }
  process.exit(1);
});

export { server };
export default server;
