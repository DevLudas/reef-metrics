import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ErrorCode = "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER_ERROR" | "UNAUTHORIZED" | "FORBIDDEN";

interface ErrorDetail {
  field: string;
  message: string;
}

interface ErrorResponseBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
}

export function errorResponse(code: ErrorCode, message: string, status: number, details?: ErrorDetail[]): Response {
  const body: ErrorResponseBody = {
    error: {
      code,
      message,
      ...(details && details.length > 0 && { details }),
    },
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
