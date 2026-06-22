import { prisma } from "../config/prisma";
import type {
  ContentReport,
  CreateContentReportInput,
  UpdateContentReportInput,
} from "../models/report.model";
import { HttpError } from "./user.service";

const contentReportSelect = {
  id: true,
  message: true,
  postId: true,
  reportedUserId: true,
  createdAt: true,
  updatedAt: true,
} as const;

type PrismaErrorWithCode = {
  code?: string;
};

const isPrismaErrorWithCode = (
  error: unknown,
  expectedCode: string,
): error is PrismaErrorWithCode =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as PrismaErrorWithCode).code === expectedCode;

export const listContentReports = async (): Promise<ContentReport[]> => {
  return prisma.contentReport.findMany({
    orderBy: { createdAt: "desc" },
    select: contentReportSelect,
  });
};

export const getContentReportById = async (
  id: string,
): Promise<ContentReport> => {
  const report = await prisma.contentReport.findUnique({
    where: { id },
    select: contentReportSelect,
  });

  if (!report) {
    throw new HttpError(404, "Content report not found");
  }

  return report;
};

export const createContentReport = async (
  data: CreateContentReportInput,
): Promise<ContentReport> => {
  return prisma.contentReport.create({
    data,
    select: contentReportSelect,
  });
};

export const updateContentReport = async (
  id: string,
  data: UpdateContentReportInput,
): Promise<ContentReport> => {
  const updateData = {
    ...data,
    ...(data.postId !== undefined ? { reportedUserId: null } : {}),
    ...(data.reportedUserId !== undefined ? { postId: null } : {}),
  };

  try {
    return await prisma.contentReport.update({
      where: { id },
      data: updateData,
      select: contentReportSelect,
    });
  } catch (error) {
    if (isPrismaErrorWithCode(error, "P2025")) {
      throw new HttpError(404, "Content report not found");
    }

    throw error;
  }
};

export const deleteContentReport = async (id: string): Promise<void> => {
  try {
    await prisma.contentReport.delete({
      where: { id },
    });
  } catch (error) {
    if (isPrismaErrorWithCode(error, "P2025")) {
      throw new HttpError(404, "Content report not found");
    }

    throw error;
  }
};
