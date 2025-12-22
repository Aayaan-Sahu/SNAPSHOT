import React, { useState } from "react";
import { View, Text, Button, ActivityIndicator, StyleSheet } from "react-native";

import { useAuth } from "../../context/AuthContext";

export function AuthScreen() {
  const { signIn } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const handleLogin = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
    } catch (e: any) {
      alert(`Login failed: ${e.message}`)
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SNAPSHOT</Text>
      {isSigningIn ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Continue with Google" onPress={handleLogin} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
});