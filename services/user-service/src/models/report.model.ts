export interface ContentReport {
  id: string;
  message: string;
  postId: string | null;
  commentId: string | null;
  reportedUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContentReportInput {
  message: string;
  postId?: string;
  commentId?: string;
  reportedUserId?: string;
}

export interface UpdateContentReportInput {
  message?: string;
  postId?: string;
  commentId?: string;
  reportedUserId?: string;
}

export interface ContentReportParams {
  [key: string]: string;
  id: string;
}
