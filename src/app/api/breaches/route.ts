import { isValidEmail, normalizeEmail } from "@/lib/email";
import { LookupError, lookupAccount, lookupWithoutKey } from "@/lib/hibp";

export async function POST(request: Request) {
  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  } catch {
    return json({ error: "Enter a valid email address." }, 400);
  }

  if (!isValidEmail(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }

  const apiKey = process.env.HIBP_API_KEY?.trim() ?? "";
  if (!apiKey) {
    return json(lookupWithoutKey(), 200);
  }

  try {
    const result = await lookupAccount(email, apiKey);
    return json(result, 200);
  } catch (error) {
    if (error instanceof LookupError) {
      return json({ error: error.message }, error.status);
    }
    return json({ error: "Have I Been Pwned could not complete the lookup." }, 502);
  }
}

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}
