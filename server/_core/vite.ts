import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  console.log('[SERVER] serveStatic called');
  console.log('[SERVER] import.meta.dirname:', import.meta.dirname);
  const distPath = path.resolve(import.meta.dirname, "../", "dist", "public");
  console.log('[SERVER] distPath resolved to:', distPath);
  
  if (!fs.existsSync(distPath)) {
    console.error('[SERVER] Could not find the build directory:', distPath);
    console.error('[SERVER] Checking what exists:');
    const parentDir = path.resolve(import.meta.dirname, "../");
    console.error('[SERVER] Parent dir:', parentDir);
    try {
      console.error('[SERVER] Contents:', fs.readdirSync(parentDir));
    } catch (e) {
      console.error('[SERVER] Error reading parent dir:', e);
    }
    process.exit(1);
  }

  console.log('[SERVER] distPath exists, contents:', fs.readdirSync(distPath));
  // Serve static files, but exclude /api/ routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log('[SERVER] [STATIC] Skipping API route:', req.path);
      return next();
    }
    express.static(distPath)(req, res, next);
  });
  console.log('[SERVER] Static middleware configured with API route protection');

  // fall through to index.html if the file doesn't exist
  // BUT: Don't intercept /api/ routes - let them fall through to 404
  app.use("*", (req, res, next) => {
    // Skip API routes - let them be handled by other middleware
    if (req.path.startsWith('/api/')) {
      console.log('[SERVER] Skipping API route:', req.path);
      return next();
    }
    
    console.log('[SERVER] Fallback route hit for:', req.originalUrl);
    const indexPath = path.resolve(distPath, "index.html");
    console.log('[SERVER] Sending index.html from:', indexPath);
    if (fs.existsSync(indexPath)) {
      console.log('[SERVER] index.html exists, sending it');
      res.sendFile(indexPath);
    } else {
      console.error('[SERVER] index.html NOT FOUND at:', indexPath);
      res.status(404).send('index.html not found');
    }
  });
}
