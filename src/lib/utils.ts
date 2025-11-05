import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ErrorResponseDTO, ValidationErrorDetail } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: string | ValidationErrorDetail[]
): Response {
  return new Response(
    JSON.stringify({
      error: { code, message, details },
    } as ErrorResponseDTO),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}
