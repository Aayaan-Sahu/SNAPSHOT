import React, { useEffect, useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootStackParamList } from "../../navigation/types";
import { useNavigation } from "@react-navigation/native";
import { ScreenStackHeaderRightView } from "react-native-screens";
import { Ionicons } from "@expo/vector-icons";
import { fetchGroupOwner } from "./api";

type Props = NativeStackScreenProps<RootStackParamList, "GroupSlideshow">;

export const GroupSlideshowScreen = ({ route }: Props) => {
  const { groupId, groupName, ownerId } = route.params;

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (ownerId) {
              navigation.navigate("GroupInfo", {
                groupId: groupId,
                groupName: groupName,
                ownerId: ownerId,
              });
            }
          }}
        >
          <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, groupId, groupName, ownerId]);

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