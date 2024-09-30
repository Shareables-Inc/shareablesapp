import { Post } from "../models/post";

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  VerifyEmail: undefined;
  NameInput: undefined;
  UsernameInput: undefined;
  TopCuisines: undefined;
  InviteContacts: undefined;
  FollowFriends: { userContacts: string[] };
  MainTabNavigator: {
    screen: "Post" | "Profile" | "RestaurantProfile" | "UserProfile";
    params?:
      | { userId: string }
      | {
          establishmentId: string;
        };
    establishmentId: string;
    restaurantName: string;
    tags: string[];
    postId: string;
  };
  Review: {
    establishmentId: string;
    restaurantName: string;
    tags: string[];
    postId: string;
  };
  Notifications: undefined;
  Mailbox: undefined;
  MainSettings: undefined;
  AccountSettings: undefined;
  ChangePassword: undefined;
  EditProfile: undefined;
  NotificationsSettings: undefined;
  PrivacySettings: undefined;
  LocationSelection: undefined;
  TagsSelection: undefined;
  ExpandedPost: { postId: string };
  UserProfile: { userId: string };
  RestaurantProfile: {
    establishmentId: string;
  };
  HomePage: {
    postId: string;
  };
};
