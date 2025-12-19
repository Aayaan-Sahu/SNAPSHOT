import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Group } from "../api/types";

interface GroupCardProps {
    group: Group,
    onPress: (group: Group) => void;
}

export const GroupCard = ({ group, onPress }: GroupCardProps) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(group)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{group.name}</Text>
        <Text style={styles.status}>View Group Session</Text>
      </View>
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>→</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: "#666",
  },
  arrow: {
    paddingLeft: 12,
  },
  arrowText: {
    fontSize: 20,
    color: "#ccc",
  },
});