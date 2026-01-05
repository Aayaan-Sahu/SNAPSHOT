import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../../navigation/types";
import { fetchGroupMembers } from "./api";
import { Friend } from "../../api/types";

type Props = NativeStackScreenProps<RootStackParamList, "GroupInfo">;

export const GroupInfoScreen = ({ route, navigation }: Props) => {
  const { groupId, groupName, ownerId } = route.params;

  const [members, setMembers] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await fetchGroupMembers(groupId);
      setMembers(data);
    } catch (e) {
      console.error("Failed to load group members", e);
      Alert.alert("Error", "Could not load group members.");
    } finally {
      setLoading(false);
    }
  };

  const renderMember = ({ item }: { item: Friend }) => {
    const isOwner = item.id === ownerId;

    return (
      <View style={styles.memberRow}>
        <Image
          source={{
            uri: item.picture || "https://ui-avatars.com/api/?name=" + item.name,
          }}
          style={styles.avatar}
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          {isOwner && (
            <Text style={styles.adminLabel}>Owner</Text>
          )}
        </View>
        
        {/* Optional: Add chevron or actions here later */}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              {/* Group Icon Placeholder */}
              <View style={styles.groupIconLarge}>
                <Text style={styles.groupInitialsLarge}>
                  {groupName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              
              <Text style={styles.groupNameTitle}>{groupName}</Text>
              <Text style={styles.memberCountText}>{members.length} Members</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7", // iOS Grouped Background
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 40,
  },

  // Header Section
  headerContainer: {
    alignItems: "center",
    paddingVertical: 32,
    marginBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C6C6C8",
  },
  groupIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E1E1E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  groupInitialsLarge: {
    fontSize: 32,
    fontWeight: "700",
    color: "#555",
  },
  groupNameTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  memberCountText: {
    fontSize: 15,
    color: "#888",
  },

  // Member Row
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C6C6C8",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  memberName: {
    fontSize: 17,
    color: "#000",
  },
  adminLabel: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "600",
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
});