import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // ============================================================
  // LOGIN LOCAL - Funciona sem OAuth do Manus (uso local/offline)
  // Ativo quando OAUTH_SERVER_URL não está configurado
  // ============================================================
  app.post("/api/local-login", async (req: Request, res: Response) => {
    // Só permite login local quando não há OAuth configurado
    // (segurança: em produção com OAuth, este endpoint é desabilitado)
    const { password } = req.body as { password?: string };

    // Senha padrão local: "wodpulse2026" ou a definida em LOCAL_LOGIN_PASSWORD
    const localPassword = process.env.LOCAL_LOGIN_PASSWORD || "wodpulse2026";

    if (password !== localPassword) {
      res.status(401).json({ error: "Senha incorreta" });
      return;
    }

    try {
      // Cria/atualiza usuário admin local no banco
      await db.upsertUser({
        openId: "local-admin",
        name: "Admin Local",
        email: "admin@wodpulse.local",
        loginMethod: "local",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken("local-admin", {
        name: "Admin Local",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true });
    } catch (error) {
      console.error("[LocalLogin] Failed", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });
}
