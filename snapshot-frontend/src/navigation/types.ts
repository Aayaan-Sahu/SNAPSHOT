import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  GroupSlideshow: { groupId: string; groupName: string };
  Camera: undefined;
  Friends: undefined;
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;