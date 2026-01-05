import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  GroupSlideshow: { groupId: string; groupName: string, ownerId: string };
  Camera: undefined;
  Friends: undefined;
  GroupInfo: {
    groupId: string;
    groupName: string;
    ownerId: string;
  };
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;