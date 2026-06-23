import "dotenv/config";

import { createServer } from "http";

import app from "./app.js";
import { env } from "./config/env.js";
import { registerChatGateway } from "./websocket/chat.gateway.js";

const httpServer = createServer(app);
const gateway = registerChatGateway(httpServer);

httpServer.listen(env.port, () => {
  console.log(`chat-service running on http://localhost:${env.port}`);
  console.log(`chat-service websocket path: ${env.socketPath}`);
});

function shutdown() {
  gateway.io.close(() => {
    httpServer.close(() => {
      process.exit(0);
    });
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
