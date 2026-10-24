import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin, type Connect } from "vite";

/* ------------------------------------------------------------------ *
 * Dev-only consolidated auth fallback.
 *
 * The login form POSTs to `/consolidated/api/auth/login`, which the
 * consolidated service resolves against Keycloak. That service is not
 * running in this workspace, so every sign-in failed with "Invalid
 * username or password" no matter what was typed. This middleware only
 * exists in `vite dev` (it is never bundled into the built site) and
 * performs the same exchange the service would: username/password ->
 * Keycloak direct grant -> access token.
 * ------------------------------------------------------------------ */
const KEYCLOAK_TOKEN_URL =
  process.env.KEYCLOAK_TOKEN_URL ??
  "http://localhost:8080/realms/banking/protocol/openid-connect/token";
const KEYCLOAK_CLIENT_ID =
  process.env.KEYCLOAK_CLIENT_ID ?? "banking-onboarding-api";
const KEYCLOAK_CLIENT_SECRET =
  process.env.KEYCLOAK_CLIENT_SECRET ?? "wRyRKKZiuFZWeJdBByoylpBeycRNue8y";

function devConsolidatedAuth(): Plugin {
  return {
    name: "dev-consolidated-auth",
    configureServer(server) {
      server.middlewares.use(
        "/consolidated/api/auth/login",
        async (req: Connect.IncomingMessage, res, next) => {
          if (req.method !== "POST") {
            next();
            return;
          }

          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);

          let username = "";
          let password = "";
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
              username?: unknown;
              password?: unknown;
            };
            username = typeof body.username === "string" ? body.username : "";
            password = typeof body.password === "string" ? body.password : "";
          } catch {
            /* fall through to the 400 below */
          }

          const fail = (status: number, message: string) => {
            res.statusCode = status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ message }));
          };

          if (!username || !password) {
            fail(400, "Username and password are required");
            return;
          }

          try {
            const tokenRes = await fetch(KEYCLOAK_TOKEN_URL, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                grant_type: "password",
                client_id: KEYCLOAK_CLIENT_ID,
                client_secret: KEYCLOAK_CLIENT_SECRET,
                username,
                password,
              }),
            });
            const tokenBody: unknown = await tokenRes.json().catch(() => null);

            if (!tokenRes.ok || !tokenBody) {
              fail(401, "Invalid username or password");
              return;
            }

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(tokenBody));
          } catch {
            fail(502, "The authentication service is unreachable");
          }
        },
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), devConsolidatedAuth()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/consolidated": {
        target: "http://localhost:8082",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/consolidated/, ""),
      },
    },
  },
});
