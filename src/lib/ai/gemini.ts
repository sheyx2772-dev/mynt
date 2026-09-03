import "server-only";

// The first model call in this codebase.
//
// Everything about it is arranged so that a page never depends on it working.
// The assistant is an extra opinion beside a list the owner can already read;
// if the vendor is slow, out of quota or down, the screen has to carry on
// showing the list. So this returns null rather than throwing, on every path,
// and the caller renders the list either way.

/**
 * Tried in order, and the order was measured rather than assumed.
 *
 * On this key: 3.6-flash answered a trivial prompt in 8s, the `latest` alias
 * was returning 503 under load, and the preview took 25s for the same prompt.
 * So the fast one leads, the alias is second because it is the name that
 * survives the vendor rotating models underneath it, and the preview is a last
 * resort rather than a choice — a briefing that silently fails to appear is
 * indistinguishable from one that was never built.
 *
 * Google has already closed gemini-2.5-flash to new keys with no warning,
 * which is why this is a list and not a constant.
 */
const MODELS = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3-flash-preview"];

const endpointFor = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/** Worth trying the next model for; anything else is our mistake, not theirs. */
function isTransient(status: number): boolean {
  return status === 429 || status >= 500;
}

// Per attempt, and generous because the measurements demanded it: the fast
// models answer a real briefing prompt in seconds but return 503 under load
// often enough to matter, and the one that is always reachable took over two
// minutes for the same prompt. A short timeout here does not make the feature
// faster, it makes it fail.
//
// This is why the result is stored rather than recomputed on render, and why a
// deployment has to allow the page a long enough function duration — see
// maxDuration on the network page.
const TIMEOUT_MS = 120_000;

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export type AskOptions = {
  /** Ask for JSON back and refuse anything else. */
  schema?: Record<string, unknown>;
  /** Steer it once rather than repeating the rules in every prompt. */
  system?: string;
};

/**
 * Ask the model something, and return null if anything at all goes wrong.
 *
 * Null covers every failure the same way on purpose — no key, no network, a
 * refusal, a timeout, malformed JSON — because the caller's response to all of
 * them is identical: show the list without the assistant's note on top. A
 * thrown error would instead take out the page.
 */
export async function ask(
  prompt: string,
  options: AskOptions = {},
): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;

  const body = JSON.stringify({
    ...(options.system
      ? { systemInstruction: { parts: [{ text: options.system }] } }
      : {}),
    generationConfig: {
      // Low, not zero. This is a summary of somebody's week, not a creative
      // exercise, and the same list on two mornings should not produce two
      // different opinions.
      temperature: 0.2,
      maxOutputTokens: 2048,
      ...(options.schema
        ? {
            responseMimeType: "application/json",
            responseSchema: options.schema,
          }
        : {}),
    },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  for (const model of MODELS) {
    try {
      const response = await fetch(`${endpointFor(model)}?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Never cached: the answer is about a list that changed this morning.
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body,
      });

      if (!response.ok) {
        // The body carries the reason — quota, a bad key, a rejected schema —
        // and it is worth having in the log, since the screen deliberately
        // says nothing about it.
        console.error(
          `gemini(${model}):`,
          response.status,
          (await response.text()).slice(0, 300),
        );
        if (isTransient(response.status)) continue;
        return null;
      }

      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };

      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();

      if (text) return text;
      // An empty answer from a healthy model is not worth a second attempt at
      // a different one: the prompt is the problem.
      return null;
    } catch (error) {
      console.error(`gemini(${model}) call failed:`, error);
    }
  }

  return null;
}

/** The same call, parsed. Null on anything that is not the shape asked for. */
export async function askJson<T>(
  prompt: string,
  schema: Record<string, unknown>,
  system?: string,
): Promise<T | null> {
  const text = await ask(prompt, { schema, system });
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    console.error("gemini returned something that was not json");
    return null;
  }
}
