import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  onSendRequest: (email: string) => Promise<boolean>;
}

export const FriendSearchInput = ({ onSendRequest }: Props) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (!email.trim()) return;

    setLoading(true);
    const success = await onSendRequest(email);
    setLoading(false);

    if (success) {
      setEmail(""); // Clear input on success
      Alert.alert("Success", "Friend request sent!");
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color="#888" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Add friend by email..."
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="send"
        onSubmitEditing={handlePress}
      />
      <TouchableOpacity
        onPress={handlePress}
        disabled={loading || !email.trim()}
        style={styles.sendBtn}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Ionicons
            name="arrow-forward-circle"
            size={28}
            color={email.trim() ? "#007AFF" : "#ccc"}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f7", // iOS Input Grey
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    margin: 16,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  sendBtn: {
    marginLeft: 8,
  }
});