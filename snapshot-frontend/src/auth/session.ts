import { client, getAuthToken, deleteAuthToken } from "../api/client";

export async function restoreSession() {
  const token = await getAuthToken();
  if (!token) return { ok: false as const };

  try {
    const me = await client.get("/api/me");
    return { ok: true as const, me: me.data };
  } catch (err: any) {
    if (err?.response?.status === 401) {
      await deleteAuthToken();
    }
    return { ok: false as const };
  }
}