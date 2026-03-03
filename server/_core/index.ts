import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  console.log('[SERVER] Starting server...');
  console.log('[SERVER] NODE_ENV:', process.env.NODE_ENV);
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  console.log('[SERVER] Registering OAuth routes');
  registerOAuthRoutes(app);
  // tRPC API
  console.log('[SERVER] Setting up tRPC middleware');
  app.use("/api/trpc", (req, res, next) => {
    console.log('[SERVER] [tRPC] Request received:', req.method, req.path, req.url);
    console.log('[SERVER] [tRPC] Headers:', req.headers);
    next();
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  console.log('[SERVER] tRPC middleware configured');
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    console.log('[SERVER] Using Vite for development');
    await setupVite(app, server);
  } else {
    console.log('[SERVER] Using static file serving for production');
    // Add logging middleware BEFORE static files
    app.use((req, res, next) => {
      console.log('[SERVER] [STATIC] Request:', req.method, req.path, req.url);
      next();
    });
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  console.log('[SERVER] Looking for available port starting from:', preferredPort);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`[SERVER] Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[SERVER] Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
