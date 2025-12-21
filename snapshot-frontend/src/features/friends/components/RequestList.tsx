import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ListRenderItem,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Standard in Expo
import { PendingRequest } from "../../../api/types";

interface RequestListProps {
  data: PendingRequest[];
  type: "incoming" | "outgoing";
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCancel?: (id: string) => void;

  refreshing: boolean;
  onRefresh: () => void;
}

export const RequestList = ({
  data,
  type,
  onAccept,
  onDecline,
  onCancel,
  refreshing,
  onRefresh,
}: RequestListProps) => {
  
  const renderItem: ListRenderItem<PendingRequest> = ({ item }) => (
    <View style={styles.itemContainer}>
      {/* 1. Avatar */}
      <Image
        source={{
          uri: item.picture || "https://ui-avatars.com/api/?name=" + item.name,
        }}
        style={styles.avatar}
      />

      {/* 2. Text Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>

      {/* 3. Action Buttons (Conditional) */}
      <View style={styles.actions}>
        {type === "incoming" ? (
          <>
            {/* INCOMING: Decline (X) and Accept (Check) */}
            <TouchableOpacity
              style={[styles.iconBtn, styles.declineBtn]}
              onPress={() => onDecline?.(item.id)}
            >
              <Ionicons name="close" size={20} color="#ff4757" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.iconBtn, styles.acceptBtn]}
              onPress={() => onAccept?.(item.id)}
            >
              <Ionicons name="checkmark" size={20} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* OUTGOING: Cancel Text Button */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => onCancel?.(item.id)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      // UI Polish: Show a message if list is empty
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No {type} requests</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 10,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    // Adding a subtle separator line behavior without a separate component
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#eee",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // Easy spacing between buttons
  },
  // Button Styles
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptBtn: {
    backgroundColor: "#2ed573", // Success Green
  },
  declineBtn: {
    backgroundColor: "#f1f2f6", // Subtle Grey
    borderWidth: 1,
    borderColor: "#dfe4ea",
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f1f2f6",
    borderRadius: 6,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#57606f",
  },
  // Empty State
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#aaa",
    fontSize: 15,
  },
});