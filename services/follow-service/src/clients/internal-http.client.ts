import axios from "axios";
import { env } from "../config/env.js";

export const internalHttpClient = axios.create({
  baseURL: env.internalNginxUrl,
  timeout: env.requestTimeoutMs,
  headers: {
    Accept: "application/json",
  },
});
