/**
 * Kalvium Campus Navigator & Request Processing Simulator
 * Server Entry Proxy
 * 
 * Forwards execution to src/server.js to maintain package.json compatibility.
 */

export * from './src/server.js';
import server from './src/server.js';
export default server;
