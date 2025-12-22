import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RootStackParamList } from "./types";
import { useAuth } from "../context/AuthContext";

import { AuthScreen } from "../features/authentication/AuthScreen";
import { HomeScreen } from "../features/feed/HomeScreen";
import { CameraScreen } from "../features/camera/CameraScreen";
import { FriendsScreen } from "../features/friends/FriendsScreen";
import { GroupSlideshowScreen } from "../features/feed/GroupSlideshowScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
          />
          <Stack.Screen 
            name="GroupSlideshow" 
            component={GroupSlideshowScreen}
            options={{ headerShown: true, title: "Group Memory" }} 
          />
          <Stack.Screen 
            name="Friends" 
            component={FriendsScreen} 
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen} 
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ animationTypeForReplace: 'pop' }}
        />
      )}
    </Stack.Navigator>
  );
}