import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { fetchUserGroups } from "./api";
import { Group } from "../../api/types";
import { GroupCard } from "../../components/GroupCard";
import { useAuth } from "../../context/AuthContext";
import { RootStackParamList } from "../../navigation/types";

export const HomeScreen = () => {
  const { user, signOut } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Typed navigation hook
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
        <Button title="Logout" onPress={signOut} color="red" />
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroupCard group={item} onPress={handleGroupPress} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>You haven't joined any groups yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#eee", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "bold" },
  listContent: { padding: 16 },
  emptyState: { padding: 40, alignItems: "center" },
  emptyText: { color: "#888", fontSize: 16 },
});