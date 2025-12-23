import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import { SnapshotProvider } from "./src/context/SnapshotContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SnapshotProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </SnapshotProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}