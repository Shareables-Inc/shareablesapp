// create a react query hook that fetches the likes of a post

import { useMutation, useQuery } from "@tanstack/react-query";
import { LikesService } from "../services/likes.service";
import { queryClient } from "../utils/query.client";

const likesService = new LikesService();

export const useGetUserLikes = (userId: string) => {
  return useQuery({
    queryKey: ["user-likes", userId],
    queryFn: () => likesService.getLikes(userId),
  });
};

// add a like to a post and invalidate the userLikes query and provide a toggle like function
export const useToggleLike = () => {
  return useMutation({
    mutationFn: (variables: { postId: string; userId: string }) =>
      likesService.addLike(variables.userId, variables.postId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-likes"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
    },
    onError: (error) => {
      console.error("Error adding like:", error);
    },
  });
};

export const useRemoveLike = () => {
  return useMutation({
    mutationFn: (variables: { postId: string; userId: string }) =>
      likesService
        .removeLike(variables.userId, variables.postId)
        .catch((error) => {
          console.error("Error removing like:", error);
          throw error;
        }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-likes"] });
      queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
    },
    onError: (error) => {
      console.error("Error removing like:", error);
    },
  });
};
