import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from "@/lib/auth-token-storage";

type AuthResponse = {
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

const AUTH_ROUTES = ["/login", "/register"];
const PROTECTED_ROUTES = ["/", "/profile"];
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function isMatchingRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function getApiUrl(request: NextRequest, path: string) {
  const baseUrl =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080/api";
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  if (normalizedBaseUrl.startsWith("http")) {
    return `${normalizedBaseUrl}${path}`;
  }

  return new URL(`${normalizedBaseUrl}${path}`, request.nextUrl.origin).toString();
}

function isHttpsRequest(request: NextRequest) {
  return (
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  );
}

function setTokenCookies(
  request: NextRequest,
  response: NextResponse,
  tokens: { accessToken?: string; refreshToken?: string },
) {
  const secure = isHttpsRequest(request);

  if (tokens.accessToken) {
    response.cookies.set(ACCESS_TOKEN_KEY, tokens.accessToken, {
      httpOnly: true,
      maxAge: TOKEN_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure,
    });
  }

  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, {
      httpOnly: true,
      maxAge: TOKEN_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure,
    });
  }
}

function clearTokenCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_KEY);
  response.cookies.delete(REFRESH_TOKEN_KEY);
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);

  const response = NextResponse.redirect(loginUrl);
  clearTokenCookies(response);

  return response;
}

async function refreshAccessToken(request: NextRequest, refreshToken: string) {
  try {
    const response = await fetch(getApiUrl(request, "/auth/refresh-token"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as AuthResponse;

    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = isMatchingRoute(pathname, AUTH_ROUTES);
  const isProtectedRoute = isMatchingRoute(pathname, PROTECTED_ROUTES);

  const accessToken = request.cookies.get(ACCESS_TOKEN_KEY)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_KEY)?.value;

  if (accessToken) {
    return NextResponse.next();
  }

  if (refreshToken) {
    const refreshedTokens = await refreshAccessToken(request, refreshToken);

    if (refreshedTokens?.accessToken) {
      const response = isAuthRoute
        ? NextResponse.redirect(new URL("/", request.url))
        : NextResponse.next();

      setTokenCookies(request, response, {
        accessToken: refreshedTokens.accessToken,
        refreshToken: refreshedTokens.refreshToken ?? refreshToken,
      });

      return response;
    }

    if (isProtectedRoute) {
      return redirectToLogin(request);
    }

    const response = NextResponse.next();
    clearTokenCookies(response);

    return response;
  }

  if (isProtectedRoute) {
    return redirectToLogin(request);
  }

  const response = NextResponse.next();
  clearTokenCookies(response);

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
