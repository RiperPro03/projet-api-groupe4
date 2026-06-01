import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
    res.json({
        service: "api-gateway",
        status: "OK"
    });
});

app.use("/api/auth", createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: {
        "^/api/auth": ""
    }
}));

app.use("/api/users", createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || "http://localhost:3002",
    changeOrigin: true,
    pathRewrite: {
        "^/api/users": ""
    }
}));

app.use("/api/posts", createProxyMiddleware({
    target: process.env.POST_SERVICE_URL || "http://localhost:3003",
    changeOrigin: true,
    pathRewrite: {
        "^/api/posts": ""
    }
}));

app.use("/api/follows", createProxyMiddleware({
    target: process.env.FOLLOW_SERVICE_URL || "http://localhost:3004",
    changeOrigin: true,
    pathRewrite: {
        "^/api/follows": ""
    }
}));

app.use("/api/feed", createProxyMiddleware({
    target: process.env.FEED_SERVICE_URL || "http://localhost:3005",
    changeOrigin: true,
    pathRewrite: {
        "^/api/feed": ""
    }
}));

export default app;