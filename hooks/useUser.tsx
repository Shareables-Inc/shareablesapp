import {useMutation, useQuery} from "@tanstack/react-query";
import {UserService} from "../services/user.service";
import {queryClient} from "../utils/query.client";

const userService = new UserService();

export const useUserGetByUid = (uid: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ["userDetails", uid],
    queryFn: () => userService.getUserByUid(uid),
    enabled: !!uid,
  });

  return { data, isLoading };
};

export const useUserGetByUsername = (username: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["userDetails", username],
    queryFn: () => userService.getUserByUsername(username),
    enabled: false,
  });

  return { data, isLoading, refetch };
};

export const useUserUpdatePreferences = () => {
  return useMutation({
    mutationFn: ({
                   uid,
                   preferences,
                 }: {
      uid: string;
      preferences: {
        notifications: boolean;
        reviewReminders: boolean;
        newFollowers: boolean;
        likesOnPosts: boolean;
        commentsOnPosts: boolean;
        friendPosts: boolean;
      };
    }) => userService.updateUserPreferences(uid, preferences),
    onSuccess: (_, variables) => {
  
      queryClient.invalidateQueries({
        queryKey: ["userDetails", variables.uid],
      });
    },
    onError: (error) => {
      console.error("Error updating preferences", error);
    },
  });
};