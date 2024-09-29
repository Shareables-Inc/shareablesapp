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
    screen: "Home" | "Post" | "Profile" | "RestaurantProfile" | "UserProfile";
    params?: {
      screen: "RestaurantProfile" | "UserProfile";
      params?:
        | { userId: string }
        | {
            establishmentId: string;
            establishmentName: string;
            city: string;
            country: string;
            priceRange: number;
            status: string;
            website: string;
            hours: string[];
            averageRating: number;
          };
    };
  };
  Review: {
    restaurantName: string;
    tags: string[];
    postId: string;
  };
  Notifications: undefined;
  Mailbox: undefined;
  MainSettings: undefined;
  ReportBug: undefined;
  RequestFeature: undefined;
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
    establishmentName: string;
    city: string;
    country: string;
    priceRange: number;
    status: string;
    website: string;
    hours: string[];
    averageRating: number;
  };
};
