import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated 
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

import { Group } from "../../../api/types";

interface GroupListItemProps {
  group: Group;
  onPress: (group: Group) => void;
  onDeletePress: (group: Group) => void;
}

export const GroupListItem = ({ group, onPress, onDeletePress }: GroupListItemProps) => {
  
  // This renders the "Hidden" trash can behind the row
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity 
        style={styles.deleteAction} 
        onPress={() => onDeletePress(group)}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity 
        style={styles.container} 
        onPress={() => onPress(group)}
        activeOpacity={0.9}
      >
        {/* Group Icon (Initials) */}
        <View style={styles.icon}>
          <Text style={styles.initials}>
            {group.name.substring(0, 2).toUpperCase()}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{group.name}</Text>
          <Text style={styles.subtext}>Tap to view timeline</Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    // Note: We remove shadows/margins here to make swiping look cleaner, 
    // usually swipes look best on flat lists with separators.
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  initials: {
    fontSize: 18,
    fontWeight: "700",
    color: "#555",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: "#888",
  },
  // The red background behind the swipe
  deleteAction: {
    backgroundColor: "#ff3b30",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
});