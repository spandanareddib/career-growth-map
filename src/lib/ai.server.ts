import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText, type ModelMessage } from "ai";
import type { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const RUN_ID = "X-Lovable-AIG-Run-ID";

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_ID)?.trim() || undefined;
    return res;
  };
}

export class AiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

/** Streams a structured Responses call server-side and returns the parsed object. */
export async function structuredCall<T>(schema: z.ZodType<T>, system: string, messages: ModelMessage[]): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("AI is not configured.", 401);
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });
  let streamError: unknown;
  const result = streamText({
    model: provider.responses(MODEL),
    messages: [{ role: "system", content: system }, ...messages],
    output: Output.object({ schema }),
    maxRetries: 1,
    onError: ({ error }) => {
      streamError = error;
    },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  try {
    return (await result.output) as T;
  } catch (error) {
    const e = (streamError ?? error) as { statusCode?: number; message?: string };
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      try {
        return schema.parse(JSON.parse(error.text));
      } catch {
        /* fall through */
      }
    }
    const status = e?.statusCode;
    if (status === 402) throw new AiError("AI credits are used up. Add credits to keep analyzing.", 402);
    if (status === 429) throw new AiError("Too many requests right now. Please try again in a minute.", 429);
    if (status === 403) throw new AiError("AI access was denied for this request.", 403);
    throw new AiError(e?.message || "The AI could not finish this request.", status);
  }
}
