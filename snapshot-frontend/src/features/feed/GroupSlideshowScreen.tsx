import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "GroupSlideshow">;

export const GroupSlideshowScreen = ({ route }: Props) => {
  const { groupId, groupName } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Slideshow for: {groupName}</Text>
      <Text style={styles.subText}>ID: {groupId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 20, fontWeight: "bold" },
  subText: { color: "#666", marginTop: 8 },
});