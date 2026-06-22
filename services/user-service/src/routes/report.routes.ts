import { Router } from "express";

import {
  createContentReportController,
  deleteContentReportController,
  getContentReportByIdController,
  listContentReportsController,
  updateContentReportController,
} from "../controllers/report.controller";
import {
  validateContentReportParams,
  validateCreateContentReport,
  validateUpdateContentReport,
} from "../middlewares/report.validator";
import type { ContentReportParams } from "../models/report.model";

const router = Router();

router.post("/", validateCreateContentReport, createContentReportController);
router.get("/", listContentReportsController);

router.get<ContentReportParams>(
  "/:id",
  validateContentReportParams,
  getContentReportByIdController,
);

router.put<ContentReportParams>(
  "/:id",
  validateContentReportParams,
  validateUpdateContentReport,
  updateContentReportController,
);

router.delete<ContentReportParams>(
  "/:id",
  validateContentReportParams,
  deleteContentReportController,
);

export default router;
