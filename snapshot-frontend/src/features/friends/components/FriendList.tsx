import React from "react";
import { View, Text, FlatList, StyleSheet, Image, Alert, TouchableOpacity } from "react-native";
import { Friend } from "../api";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  data: Friend[];
  onRemove: (id: string) => void;
}

export const FriendList = ({ data, onRemove }: Props) => {
  const handlePressRemove = (id: string, name: string) => {
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => onRemove(id) 
        }
      ]
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <Text style={styles.header}>My Friends ({data.length})</Text>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>You haven't added any friends yet.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <Image
            source={{ uri: item.picture || "https://ui-avatars.com/api/?name=" + item.name }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{item.name}</Text>

          <View style={{ flex: 1 }} />

          <TouchableOpacity 
            onPress={() => handlePressRemove(item.id, item.name)}
            style={styles.removeBtn}
          >
            <Ionicons name="close-circle-outline" size={24} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
  header: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
  removeBtn: {
    padding: 4,
  },
});