import React from "react";
import { TouchableOpacity, View, StyleSheet, Platform } from "react-native";

interface CameraTriggerProps {
  onPress: () => void;
}

export const CameraTrigger = ({ onPress }: CameraTriggerProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.outerRing}
      >
        <View style={styles.innerShutter} />
      </TouchableOpacity>
    </View>
  );
}

const BUTTON_SIZE = 80;
const INNER_SIZE = 64;

const styles = StyleSheet.create({
  // Container ensures the absolute positioning is relative to the screen bottom
  container: {
    position: "absolute",
    bottom: 40, // Distance from bottom edge
    alignSelf: "center", // Center horizontally
    zIndex: 100, // Ensure it floats above FlatLists/ScrollViews
  },
  outerRing: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "#ff4757", // Brand accent color (Red)
    justifyContent: "center",
    alignItems: "center",
    // Shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  innerShutter: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: "#ff4757",
  },
});