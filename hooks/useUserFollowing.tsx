import { useMutation, useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { FollowingService } from "../services/following.service";

import type { Post } from "../models/post";
import { queryClient } from "../utils/query.client";

const followingService = new FollowingService();

export function useUserFollowing(userId: string) {
  return useQuery({
    queryKey: ["following", userId],
    queryFn: () => followingService.getFollowing(userId),
  });
}

export function useUserCounts(userId: string) {
  return useQuery({
    queryKey: ["userCounts", userId],
    queryFn: async () => {
      const [followerCount, followingCount] = await Promise.all([
        followingService.getFollowersCount(userId),
        followingService.getFollowingCount(userId),
      ]);
      return { followerCount, followingCount };
    },
    enabled: !!userId,
  });
}

export function useIsFollowing(userId: string, followingId: string) {
  return useQuery({
    queryKey: ["isFollowing", userId, followingId],
    queryFn: () => followingService.isFollowing(userId, followingId),
    enabled: !!userId && !!followingId,
  });
}

export function useFriendDiscoverPosts(userId: string) {
  return useQuery({
    queryKey: ["friendDiscoverPosts", userId],
    queryFn: () => followingService.getFollowingPosts(userId),
    enabled: !!userId,
  });
}

export const useFollowingPosts = (
  currentUserId: string
): UseQueryResult<Post[], Error> => {
  return useQuery({
    queryKey: ["followingByUser", currentUserId],
    queryFn: async (): Promise<Post[]> => {
      if (!currentUserId) throw new Error("User not authenticated");

      const posts = await followingService.getFollowingPosts(currentUserId);

      if (posts.length === 0) {
        return [];
      }

      return posts;
    },
    enabled: !!currentUserId,
  });
};

export const useFollowingActions = (
  followingId: string,
  currentUserId: string
) => {
  const { data: isFollowing, isLoading } = useIsFollowing(
    currentUserId,
    followingId
  );

  const followMutation = useMutation({
    mutationFn: () => followingService.followUser(currentUserId, followingId),
    onSuccess: () => {
      queryClient.setQueryData(
        ["isFollowing", currentUserId, followingId],
        true
      );
      queryClient.invalidateQueries({ queryKey: ["following", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["followers", followingId] });
      queryClient.invalidateQueries({
        queryKey: ["followingCount", currentUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ["followerCount", followingId],
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => followingService.unfollowUser(currentUserId, followingId),
    onSuccess: () => {
      queryClient.setQueryData(
        ["isFollowing", currentUserId, followingId],
        false
      );
      queryClient.invalidateQueries({ queryKey: ["following", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["followers", followingId] });
      queryClient.invalidateQueries({
        queryKey: ["followingCount", currentUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ["followerCount", followingId],
      });
    },
  });

  const toggleFollow = async () => {
    if (isFollowing) {
      await unfollowMutation.mutateAsync();
    } else {
      await followMutation.mutateAsync();
    }
  };

  return {
    isFollowing: !!isFollowing,
    isToggling:
      followMutation.isPending || unfollowMutation.isPending || isLoading,
    toggleFollow,
  };
};