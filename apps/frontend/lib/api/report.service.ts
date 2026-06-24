import { httpClient } from "./http-client";

export type ContentReport = {
  id: string;
  message: string;
  postId: string | null;
  commentId: string | null;
  reportedUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreateContentReportInput =
  | {
      message: string;
      postId: string;
      commentId?: never;
      reportedUserId?: never;
    }
  | {
      message: string;
      commentId: string;
      postId?: never;
      reportedUserId?: never;
    }
  | {
      message: string;
      reportedUserId: string;
      postId?: never;
      commentId?: never;
    };

type ContentReportResponse = {
  status: string;
  data: ContentReport;
};

type ContentReportListResponse = {
  status: string;
  data: ContentReport[];
};

export async function createContentReport(
  payload: CreateContentReportInput
): Promise<ContentReport> {
  const { data } = await httpClient.post<ContentReportResponse>(
    "/users/reports",
    payload
  );

  return data.data;
}

export async function getContentReports(): Promise<ContentReport[]> {
  const { data } = await httpClient.get<ContentReportListResponse>(
    "/users/reports"
  );

  return Array.isArray(data.data) ? data.data : [];
}

export async function deleteContentReport(reportId: string): Promise<void> {
  await httpClient.delete(`/users/reports/${encodeURIComponent(reportId)}`);
}
