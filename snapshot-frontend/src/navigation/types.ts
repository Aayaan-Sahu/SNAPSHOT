import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  GroupSlideshow: { groupId: string; groupName: string };
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;