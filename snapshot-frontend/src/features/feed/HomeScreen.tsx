import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Platform,
  Button,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";
import { useSnapshot } from "../../context/SnapshotContext";
import { useSubmissionWindow } from "../camera/hooks/useSubmissionWindow";
import { NotificationsService } from "../../services/notifications";

import { GroupCard } from "../../components/GroupCard";
import { CameraTrigger } from "../camera/components/CameraTrigger";
import { GroupListItem } from "./components/GroupListItem";

import { Group } from "../../api/types";
import { fetchUserGroups, leaveGroup, deleteGroup } from "./api";
import { RootStackParamList } from "../../navigation/types";
import { CreateGroupModal } from "./CreateGroupModal";

export const HomeScreen = () => {
  const { user, signOut } = useAuth();

  const { isWindowOpen } = useSubmissionWindow();
  const { hasPosted } = useSnapshot();

  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const loadGroups = async () => {
    try {
      const data = await fetchUserGroups();
      setGroups(data);
    } catch (error) {
      console.error("Failed to load groups", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleCameraPress = () => {
    navigation.navigate("Camera");
  }

  const handleDeletePress = (group: Group) => {
    if (!user?.id) {
      console.warn("User ID missing during delete operation.");
      Alert.alert("Error", "User session not fully loaded. Please restart the app.");
      return;
    }

    const isOwner = group.owner_id === user?.id;

    if (isOwner) {
      Alert.alert(
        "Delete Group?",
        `Are you sure you want to delete "${group.name}"? This action cannot be undone and will remove it for all members.`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            style: "destructive", 
            onPress: async () => {
               try {
                 await deleteGroup(group.id);
                 // Refresh list
                 onRefresh();
               } catch (e) {
                 Alert.alert("Error", "Failed to delete group.");
               }
            } 
          }
        ]
      );
    } else {
      Alert.alert(
        "Leave Group?",
        `Are you sure you want to leave "${group.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Leave", 
            style: "destructive", 
            onPress: async () => {
               try {
                 await leaveGroup(group.id);
                 onRefresh();
               } catch (e) {
                 Alert.alert("Error", "Failed to leave group.");
               }
            } 
          }
        ]
      );
    }
  };

  useEffect(() => {
    loadGroups();

    NotificationsService.requestPermissions();
    const responseListener = NotificationsService.setupResponseListener((response) => {
      console.log("User tapped notification! navigating to...", response.notification.request.content.data.screen);
    });
    return () => {
      responseListener.remove();
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGroups();
  }, []);

  const handleGroupCreated = () => {
    onRefresh();
  }

  const handleGroupPress = (group: Group) => {
    navigation.navigate("GroupSlideshow", {
      groupId: group.id,
      groupName: group.name,
      ownerId: group.owner_id,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.largeTitle}>Groups</Text>

            <TouchableOpacity 
             onPress={() => setModalVisible(true)} 
             style={styles.iconBtn}
           >
             <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
           </TouchableOpacity>
          </View>

          <Button title="Friends" onPress={() => navigation.navigate("Friends")} />

          <Pressable
            onPress={signOut}
            hitSlop={10}
            style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>

        {/* TEST NOTIFICATION */}
        <View style={{ padding: 10, backgroundColor: "#e1f5fe" }}>
          <Button
            title="🔔 Test Notification"
            onPress={async () => {
              await NotificationsService.testTrigger();
              await NotificationsService.scheduleHourlyTriggers();
            }}
          />
        </View>

        {/* DISPLAY GROUPS */}
        {/* - Goes through every entry in groups and displays a GroupCard with its data passed in */}
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GroupListItem
              group={item}
              onPress={handleGroupPress}
              onDeletePress={handleDeletePress}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyText}>
                Create or join a group to start sharing.
              </Text>
            </View>
          }
        />

        {/* Camera Button */}
        {isWindowOpen && !hasPosted && (
          <CameraTrigger onPress={handleCameraPress} />
        )}

        {/* Create Group Modal */}
        <CreateGroupModal
          visible={isModalVisible}
          onClose={() => setModalVisible(false)}
          onSuccess={handleGroupCreated}
        />
      </View>
    </SafeAreaView>
  );
};

const IOS_BG = "#F2F2F7"; // iOS grouped background
const IOS_SEPARATOR = "#C6C6C8"; // hairline-ish separator
const IOS_LABEL_SECONDARY = "#6D6D72";
const IOS_DESTRUCTIVE = "#FF3B30"; // iOS system red

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: IOS_BG
  },
  container: {
    flex: 1,
    backgroundColor: IOS_BG
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: IOS_BG
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: IOS_BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_SEPARATOR,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between"
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: "#000",
    ...(Platform.OS === "ios" ? { fontFamily: "System" } : null)
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: IOS_LABEL_SECONDARY
  },

  textButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10
  },
  pressed: {
    opacity: 0.6
  },
  logoutText: {
    fontSize: 17,
    fontWeight: "600",
    color: IOS_DESTRUCTIVE
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24
  },

  // Wrap each GroupCard so it reads like an inset grouped cell/card
  cardWrap: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 }
      },
      android: {
        elevation: 3
      }
    })
  },

  emptyState: {
    marginTop: 40,
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 }
      },
      android: { elevation: 2 }
    })
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000"
  },
  emptyText: {
    marginTop: 6,
    fontSize: 15,
    color: IOS_LABEL_SECONDARY,
    textAlign: "center",
    lineHeight: 20
  },
  iconBtn: {
    padding: 4,
  },
});