import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from "@/lib/auth-token-storage";

export async function DELETE() {
  const response = NextResponse.json({ status: "success" });

  response.cookies.delete(ACCESS_TOKEN_KEY);
  response.cookies.delete(REFRESH_TOKEN_KEY);

  return response;
}
