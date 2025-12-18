import { client, setAuthToken } from "../api/client";

type GoogleExchangeResponse = {
  token: string;
  user?: {
    id: string;
    email: string;
    name: string;
    picture: string;
  };
};

export async function loginWithGoogleIdToken(idToken: string) {
  const res = await client.post<GoogleExchangeResponse>("/auth/google", {
    idToken,
  });

  if (!res.data?.token) {
    throw new Error("Backend did not return token");
  }

  await setAuthToken(res.data.token);
  return res.data;
}