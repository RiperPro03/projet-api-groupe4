import type { RequestHandler, Response } from "express";

import type {
  ContentReportParams,
  CreateContentReportInput,
  UpdateContentReportInput,
} from "../models/report.model";
import {
  createContentReport,
  deleteContentReport,
  getContentReportById,
  listContentReports,
  updateContentReport,
} from "../services/report.service";
import { HttpError } from "../services/user.service";

const handleControllerError = (res: Response, error: unknown) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};

export const createContentReportController: RequestHandler<
  Record<string, never>,
  unknown,
  CreateContentReportInput
> = async (req, res) => {
  try {
    const report = await createContentReport(req.body);

    res.status(201).json({
      status: "success",
      message: "Content report created successfully",
      data: report,
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const listContentReportsController: RequestHandler = async (_req, res) => {
  try {
    const reports = await listContentReports();

    res.status(200).json({
      status: "success",
      message: "Content reports retrieved successfully",
      data: reports,
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const getContentReportByIdController: RequestHandler<
  ContentReportParams
> = async (req, res) => {
  try {
    const report = await getContentReportById(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Content report retrieved successfully",
      data: report,
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const updateContentReportController: RequestHandler<
  ContentReportParams,
  unknown,
  UpdateContentReportInput
> = async (req, res) => {
  try {
    const report = await updateContentReport(req.params.id, req.body);

    res.status(200).json({
      status: "success",
      message: "Content report updated successfully",
      data: report,
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const deleteContentReportController: RequestHandler<
  ContentReportParams
> = async (req, res) => {
  try {
    await deleteContentReport(req.params.id);

    res.status(200).json({
      status: "success",
      message: "Content report deleted successfully",
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};
