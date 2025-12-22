import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { getFriends } from "../friends/api";
import { Friend } from "../../api/types";
import { createGroup } from "./api";

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateGroupModal = ({
  visible,
  onClose,
  onSuccess,
}: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFriends();
      setGroupName("");
      setSearchQuery("");
      setSelectedIds(new Set());
    }
  }, [visible])

  const loadFriends = async () => {
    setLoading(true);
    try {
      const data = await getFriends();
      setFriends(data);
    } catch (e) {
      console.error("Failed to load friends for groups", e);
    } finally {
      setLoading(false);
    }
  }

  const filteredFriends = useMemo(() => {
    if (!searchQuery) return friends;
    const lowerQ = searchQuery.toLowerCase();
    return friends.filter((f) => f.name.toLowerCase().includes(lowerQ));
  }, [friends, searchQuery]);

  const isValid = groupName.trim().length > 0 && selectedIds.size > 0;

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      await createGroup(groupName, Array.from(selectedIds));
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to create group. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.friendRow}
        onPress={() => toggleSelection(item.id)}
        activeOpacity={0.7}
      >
        {/* Selection Indicator (Circle vs Check) */}
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>

        {/* Avatar */}
        <Image
          source={{ uri: item.picture || "https://ui-avatars.com/api/?name=" + item.name }}
          style={styles.avatar}
        />

        {/* Name */}
        <Text style={styles.friendName}>{item.name}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet" // iOS Card Style
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* 1. Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Group</Text>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={!isValid || submitting}
            style={styles.headerBtn}
          >
            {submitting ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={[styles.createText, !isValid && styles.disabledText]}>
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. Group Info Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.groupNameInput}
            placeholder="Name your group"
            value={groupName}
            onChangeText={setGroupName}
            autoFocus={false} // Prevent keyboard jumping immediately
          />
        </View>

        {/* 3. Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 4. Selection List */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.id}
            renderItem={renderFriendItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {searchQuery ? "No friends found." : "You have no friends yet."}
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7", // iOS System Grey Background
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f2f2f7",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#c6c6c8",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerBtn: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 17,
    color: "#007AFF",
  },
  createText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#007AFF",
    textAlign: "right",
  },
  disabledText: {
    color: "#999",
  },
  
  // Inputs
  inputSection: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#c6c6c8",
    flexDirection: 'row',
    alignItems: 'center'
  },
  label: {
      fontSize: 16,
      fontWeight: '500',
      width: 100,
  },
  groupNameInput: {
    flex: 1,
    fontSize: 16,
    color: "black",
  },
  searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#e3e3e8',
      margin: 16,
      paddingHorizontal: 12,
      height: 36,
      borderRadius: 10
  },
  searchInput: {
      flex: 1,
      fontSize: 16
  },

  // List
  listContent: {
    backgroundColor: "white",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#c6c6c8",
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingLeft: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eff0f4", // Inner separator
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ddd",
    marginRight: 12,
  },
  friendName: {
    fontSize: 17,
    color: "black",
    flex: 1, // Push text to take available space
  },
  
  // Checkbox (The Circle / Checkmark)
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c6c6c8",
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white", // Unselected bg
  },
  checkboxSelected: {
    backgroundColor: "#007AFF", // Blue when selected
    borderColor: "#007AFF",
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 20,
      color: '#888'
  }
});