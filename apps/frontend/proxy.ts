import { NextResponse, type NextRequest } from "next/server";
import axios from "axios";
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

type CurrentUserResponse = {
  data?: {
    user?: {
      statuts?: string;
    } | null;
  };
};

const AUTH_ROUTES = ["/login", "/register"];
const PROTECTED_ROUTES = ["/", "/profile", "/admin"];
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

// Route matching helpers
function isMatchingRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

// API URL resolution
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

// Cookie security and persistence
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

// Request forwarding with refreshed tokens
function createNextResponseWithRequestTokens(
  request: NextRequest,
  tokens: { accessToken?: string; refreshToken?: string },
) {
  const requestHeaders = new Headers(request.headers);
  const cookieValues = new Map<string, string>();

  for (const cookie of request.cookies.getAll()) {
    cookieValues.set(cookie.name, cookie.value);
  }

  if (tokens.accessToken) {
    cookieValues.set(ACCESS_TOKEN_KEY, tokens.accessToken);
  }

  if (tokens.refreshToken) {
    cookieValues.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  requestHeaders.set(
    "cookie",
    Array.from(cookieValues.entries())
      .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
      .join("; "),
  );

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Authentication redirects
function redirectToLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);

  const response = NextResponse.redirect(loginUrl);
  clearTokenCookies(response);

  return response;
}

async function verifyCurrentSession(request: NextRequest, accessToken: string) {
  try {
    const response = await axios.get<CurrentUserResponse>(getApiUrl(request, "/me"), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      return false;
    }

    return response.data.data?.user?.statuts !== "INACTIVE";
  } catch {
    return false;
  }
}

async function refreshAccessToken(request: NextRequest, refreshToken: string) {
  try {
    const response = await axios.post<AuthResponse>(
      getApiUrl(request, "/auth/refresh-token"),
      { refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      },
    );

    if (response.status < 200 || response.status >= 300) {
      return null;
    }

    return response.data.data ?? null;
  } catch {
    return null;
  }
}

// Main route guard
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = isMatchingRoute(pathname, AUTH_ROUTES);
  const isProtectedRoute = isMatchingRoute(pathname, PROTECTED_ROUTES);

  const accessToken = request.cookies.get(ACCESS_TOKEN_KEY)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_KEY)?.value;

  if (accessToken && await verifyCurrentSession(request, accessToken)) {
    return isAuthRoute
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (refreshToken) {
    const refreshedTokens = await refreshAccessToken(request, refreshToken);

    if (
      refreshedTokens?.accessToken &&
      await verifyCurrentSession(request, refreshedTokens.accessToken)
    ) {
      const response = isAuthRoute
        ? NextResponse.redirect(new URL("/", request.url))
        : createNextResponseWithRequestTokens(request, {
            accessToken: refreshedTokens.accessToken,
            refreshToken: refreshedTokens.refreshToken ?? refreshToken,
          });

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

// Middleware matcher
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
