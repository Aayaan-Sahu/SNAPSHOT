import React, { useEffect } from "react";
import { Text, View, Button } from "react-native";
import { initGoogleSignin } from "./src/auth/google";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

export default function App() {
  useEffect(() => {
    initGoogleSignin();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
      <Text>SNAPSHOT</Text>
      <Button
        title="Continue with Google"
        onPress={async () => {
          try {
            const userInfo = await GoogleSignin.signIn();
            console.log("userInfo:", userInfo);
            const tokens = await GoogleSignin.getTokens();
            console.log("HAS idToken?", !!tokens.idToken);
          } catch (e) {
            console.log("Google sign-in error:", e);
          }
        }}
      />
    </View>
  );
}