import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import { SnapshotProvider } from "./src/context/SnapshotContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <AuthProvider>
      <SnapshotProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SnapshotProvider>
    </AuthProvider>
  )
}