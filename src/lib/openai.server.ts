/**
 * Servicio reutilizable de OpenAI (solo backend).
 *
 * - Usa exclusivamente la API Responses de OpenAI.
 * - La clave vive únicamente en el servidor (OPENAI_API_KEY).
 * - Nunca debe importarse desde el frontend.
 */

export const OPENAI_MODEL = "gpt-4.1-mini";

export class MissingOpenAIKeyError extends Error {
  constructor() {
    super(
      "Falta la variable de entorno OPENAI_API_KEY. Configúrala en tu proveedor de despliegue para habilitar el Chef IA.",
    );
    this.name = "MissingOpenAIKeyError";
  }
}

function getApiKey(): string {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new MissingOpenAIKeyError();
  return key;
}

export type OpenAIResponseOptions = {
  instructions?: string;
  input: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonSchema?: { name: string; schema: Record<string, unknown> };
};

/** Llama a la API Responses de OpenAI y devuelve el texto generado. */
export async function createOpenAIResponse(
  options: OpenAIResponseOptions,
): Promise<string> {
  const apiKey = getApiKey();

  const body: Record<string, unknown> = {
    model: options.model ?? OPENAI_MODEL,
    input: options.input,
  };
  if (options.instructions) body["instructions"] = options.instructions;
  if (options.temperature !== undefined) body["temperature"] = options.temperature;
  if (options.maxOutputTokens !== undefined)
    body["max_output_tokens"] = options.maxOutputTokens;
  if (options.jsonSchema) {
    body["text"] = {
      format: {
        type: "json_schema",
        name: options.jsonSchema.name,
        schema: options.jsonSchema.schema,
        strict: true,
      },
    };
  }

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      // Tiempo máximo de espera: evita que la app se quede colgada.
      signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw new Error(
        "El Chef IA está tardando más de lo normal. Vuelve a intentarlo en unos segundos.",
      );
    }
    throw new Error(
      "No pudimos conectar con el Chef IA. Revisa tu conexión a internet e inténtalo de nuevo.",
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "El Chef IA no está disponible ahora mismo. Ya estamos trabajando en ello; inténtalo más tarde.",
      );
    }
    if (res.status === 429) {
      throw new Error("Hay mucha demanda en este momento. Intenta de nuevo en unos segundos.");
    }
    if (res.status >= 500) {
      throw new Error("El Chef IA tuvo un problema temporal. Inténtalo de nuevo en un minuto.");
    }
    throw new Error(`No pudimos generar la respuesta (${res.status}). ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (typeof json.output_text === "string" && json.output_text.length > 0) {
    return json.output_text;
  }

  const text = (json.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((c) => c.type === "output_text" && typeof c.text === "string")
    .map((c) => c.text as string)
    .join("\n")
    .trim();

  if (!text) throw new Error("OpenAI devolvió una respuesta vacía.");
  return text;
}

/** Igual que createOpenAIResponse pero devuelve JSON tipado. */
export async function createOpenAIJson<T>(
  options: OpenAIResponseOptions & { jsonSchema: NonNullable<OpenAIResponseOptions["jsonSchema"]> },
): Promise<T> {
  const raw = await createOpenAIResponse(options);
  return JSON.parse(raw) as T;
}

export function hasOpenAIKey(): boolean {
  return Boolean(process.env["OPENAI_API_KEY"]);
}
