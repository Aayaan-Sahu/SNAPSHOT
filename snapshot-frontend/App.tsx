import React, { useEffect, useState } from "react";
import { Text, View, Button } from "react-native";
import { initGoogleSignin } from "./src/auth/google";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { client, deleteAuthToken } from "./src/api/client";
import { loginWithGoogleIdToken } from "./src/auth/login";

export default function App() {
  const [status, setStatus] = useState<string>("idle");
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    initGoogleSignin();
    deleteAuthToken();
  }, []);

  async function testProtected() {
    const res = await client.get("/api/me");
    setMe(res.data);
    console.log("ME:", res.data);
  }

  async function testPing() {
    const res = await client.get("/api/ping");
    console.log("PING:", res.data);
  }

  async function handleGoogleLogin() {
    try {
      setStatus("google_signin_start");

      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken;

      if (!idToken) {
        throw new Error("Missing Google idToken");
      }

      setStatus("exchanging_with_backend");
      const exchange = await loginWithGoogleIdToken(idToken);
      setStatus("backend_ok_token_stored");
      console.log("EXCHANGE USER:", exchange.user);

      await testPing();
      await testProtected();
      setStatus("done");
    } catch (e: any) {
      console.log("Login error message:", e?.message);
      console.log("Login error status:", e?.response?.status);
      console.log("Login error body:", e?.response?.data);
      console.log("Login error full:", e);
      setStatus(`error: ${e?.message ?? "unknown"}`);
    }
  }

  async function handleLogout() {
    await deleteAuthToken();
    try {
      await GoogleSignin.signOut();
    } catch { }
    setMe(null);
    setStatus("logged_out");
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
      <Text>SNAPSHOT</Text>
      <Text>Status: {status}</Text>

      <Button title="Continue with Google" onPress={handleGoogleLogin} />
      <Button title="Call /api/me (protected)" onPress={testProtected} />
      <Button title="Call /api/ping" onPress={testPing} />
      <Button title="Logout" onPress={handleLogout} />

      {me ? <Text>Me loaded ✅</Text> : <Text>Me not loaded</Text>}
    </View>
  );
}