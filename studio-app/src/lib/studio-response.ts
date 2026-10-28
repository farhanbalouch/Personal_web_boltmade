export async function parseStudioResponse(
  response: Response,
): Promise<Record<string, any>> {
  const raw = await response.text();
  let data: Record<string, any>;
  try {
    data = JSON.parse(raw);
  } catch {
    const status = response.status;
    const challenge =
      response.headers.get("cf-mitigated") === "challenge" ||
      /just a moment|checking your browser|verify you are human|cf-chl-/i.test(
        raw,
      );
    const message = challenge
      ? `The website security service requested a browser check (HTTP ${status}). Open Studio directly in Chrome, reload the page, and try again. Your token has not been verified yet.`
      : `Studio received a webpage instead of an API response (HTTP ${status}). Open Studio directly in Chrome and reload once. If it repeats, report this status; you do not need to create a new token.`;
    throw Object.assign(new Error(message), {
      status,
      code: "NON_JSON_RESPONSE",
    });
  }
  if (!response.ok)
    throw Object.assign(
      new Error(
        data.error || `Studio request failed (HTTP ${response.status}).`,
      ),
      { status: response.status },
    );
  return data;
}
