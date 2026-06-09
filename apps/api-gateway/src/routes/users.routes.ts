import { Router } from "express";

import { notImplementedHandler } from "../utils/not-implemented";

const router = Router();

// Placeholder until the user service is wired into the gateway.
router.use(notImplementedHandler);

export default router;
