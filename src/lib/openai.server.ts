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

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "La clave OPENAI_API_KEY no es válida o no tiene permisos para este modelo.",
      );
    }
    if (res.status === 429) {
      throw new Error("OpenAI está limitando las solicitudes. Intenta de nuevo en unos segundos.");
    }
    throw new Error(`Error de OpenAI (${res.status}): ${detail.slice(0, 500)}`);
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
