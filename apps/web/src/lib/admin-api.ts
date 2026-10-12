export type Administrator = {
  id: number;
  email: string;
  display_name: string;
  role: "ADMIN" | "MASTER";
  is_active: boolean;
};
export type AdminIdentity = { user: Administrator; csrf: string };

export class AdminError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function adminApi<T>(
  path: string,
  csrf?: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
    cache: "no-store",
    signal,
    ...(body === undefined
      ? {}
      : {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-CSRF": csrf || "",
          },
          body: JSON.stringify(body),
        }),
  });
  const value = await response.json();
  if (!response.ok) {
    const detail = value.detail;
    throw new AdminError(
      response.status,
      typeof detail === "string"
        ? detail
        : `${detail?.message || "Check the submitted values"}${detail?.fields ? ` (${detail.fields.join(", ")})` : ""}`,
    );
  }
  return value as T;
}
