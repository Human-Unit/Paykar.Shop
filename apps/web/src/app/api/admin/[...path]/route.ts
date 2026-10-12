// Same-origin transport only. FastAPI remains the authorization authority.
export const dynamic = "force-dynamic";

async function proxy(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (path.some((part) => !/^[a-zA-Z0-9-]+$/.test(part)))
    return new Response(null, { status: 400 });
  const base =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080/api/v1";
  const incoming = new URL(request.url);
  const headers = new Headers();
  for (const key of ["cookie", "origin", "content-type", "x-admin-csrf"]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  try {
    const result = await fetch(
      `${base.replace(/\/$/, "")}/admin/${path.join("/")}${incoming.search}`,
      {
        method: request.method,
        headers,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        ...(request.method === "POST" ? { body: await request.text() } : {}),
      },
    );
    const output = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    for (const cookie of result.headers.getSetCookie())
      output.append("Set-Cookie", cookie);
    return new Response(await result.text(), {
      status: result.status,
      headers: output,
    });
  } catch {
    return Response.json(
      { detail: "Administration service unavailable. Retry shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
