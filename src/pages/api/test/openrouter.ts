import type { APIRoute } from "astro";
import { OpenRouterService } from "@/lib/services/openrouter.service";

export const prerender = false;

interface GreetingResponse {
  message: string;
}

export const POST: APIRoute = async () => {
  try {
    const service = new OpenRouterService(import.meta.env.OPENROUTER_API_KEY, import.meta.env.OPENROUTER_DEFAULT_MODEL);

    const result = await service.createChatCompletion<GreetingResponse>({
      systemMessage: "You are a helpful assistant.",
      userMessage: "Say hello in JSON format.",
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "greeting",
          strict: true,
          schema: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
            required: ["message"],
            additionalProperties: false,
          },
        },
      },
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("OpenRouter test error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        name: error instanceof Error ? error.name : "Error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
