export type Ratings = {
  ambiance?: number;
  foodQuality?: number;
  service?: number;
  overall?: number;
};

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
            priceRange?: number;
            status?: string;
            website?: string;
            hours?: string[];
            averageRating?: number;
          };
    };
  };
  Review: {
    establishmentId: string;
    restaurantName: string;
    city: string;
    country: string;
    tags?: string[];
    postId: string;
    isEditing?: boolean;
    review?: string;
    ratings?: Ratings;
  };
  RestaurantSelect: {
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
  ExpandedPost: { postId: string; isEditing?: boolean };
  UserProfile: { userId: string };
  RestaurantProfile: {
    establishmentId: string;
    establishmentName?: string;
    city?: string;
    country?: string;
    priceRange?: number;
    status?: string;
    website?: string;
    hours?: string[];
    averageRating?: number;
  };
  FollowerList: undefined;
};
