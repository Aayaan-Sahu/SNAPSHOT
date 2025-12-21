import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomSegmentedControl } from "./components/CustomSegmentedControl";
import { RequestList } from "./components/RequestList";
import { getIncomingFriendRequests, getOutgoingFriendRequesets } from "./api";
import { PendingRequest } from "../../api/types";

export const FriendsScreen = () => {
  const [activeTab, setActiveTab] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [incoming, setIncoming] = useState<PendingRequest[]>([]);
  const [outgoing, setOutgoing] = useState<PendingRequest[]>([]);

  const loadData = async () => {
    try {
      const [incomingData, outgoingData] = await Promise.all([
        getIncomingFriendRequests(),
        getOutgoingFriendRequesets(),
      ]);
      setIncoming(incomingData);
      setOutgoing(outgoingData);
    } catch (err) {
      console.error("Failed to load friend requests:", err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const handleAccept = (id: string) => console.log("Accept:", id);
  const handleDecline = (id: string) => console.log("Decline:", id);
  const handleCancel = (id: string) => console.log("Cancel:", id);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    switch (activeTab) {
      case 0:
        return (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <AddFriendPlaceholder />
          </ScrollView>
        );
      case 1:
        return (
          <RequestList
            data={incoming}
            type="incoming"
            onAccept={handleAccept}
            onDecline={handleDecline}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case 2:
        return (
          <RequestList
            data={outgoing}
            type="outgoing"
            onCancel={handleCancel}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
      </View>

      {/* The Apple Music-style Slider */}
      <CustomSegmentedControl
        values={["Add Friend", "Incoming", "Outgoing"]}
        selectedIndex={activeTab}
        onChange={setActiveTab}
      />

      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const AddFriendPlaceholder = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Search by email to add friends</Text>
    {/* Future: <SearchBar /> */}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: 28, // Large iOS Title style
    fontWeight: "bold",
    color: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Placeholder Styles
  placeholderContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
});