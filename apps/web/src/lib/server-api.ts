import "server-only";
import { notFound } from "next/navigation";
// Only definite missing resources are 404. Network/provider failures retain the recovery UI.
export async function ensureEntity(path: string) {
  const base = (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080/api/v1"
  ).replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    return;
  }
  if (response.status === 404) notFound();
}
