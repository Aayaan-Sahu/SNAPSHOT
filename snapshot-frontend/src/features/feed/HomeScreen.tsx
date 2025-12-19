import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Pressable,
  Platform,
  Button,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { fetchUserGroups } from "./api";
import { Group } from "../../api/types";
import { GroupCard } from "../../components/GroupCard";
import { useAuth } from "../../context/AuthContext";
import { RootStackParamList } from "../../navigation/types";
import { NotificationsService } from "../../services/notifications";

export const HomeScreen = () => {
  const { user, signOut } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    loadGroups();

    NotificationsService.requestPermissions();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGroups();
  }, []);

  const handleGroupPress = (group: Group) => {
    navigation.navigate("GroupSlideshow", {
      groupId: group.id,
      groupName: group.name
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
        <View style={styles.header}>
          <View>
            <Text style={styles.largeTitle}>Groups</Text>
          </View>

          <Pressable
            onPress={signOut}
            hitSlop={10}
            style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>

      <View style={{ padding: 10, backgroundColor: "#e1f5fe" }}>
        <Button 
          title="🔔 Test Notification" 
          onPress={async () => {
            await NotificationsService.testTrigger();
            await NotificationsService.scheduleHourlyTriggers();
          }} 
        />
      </View>

        {/* Inset Grouped List Feel */}
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <GroupCard group={item} onPress={handleGroupPress} />
            </View>
          )}
          contentContainerStyle={styles.listContent}
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
  }
});