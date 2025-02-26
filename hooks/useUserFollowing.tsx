import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { FollowingService } from "../services/following.service";
import type { Post } from "../models/post";
import { queryClient } from "../utils/query.client";

const followingService = new FollowingService();

// Hook to get a list of users the current user is following
export function useUserFollowing(userId: string) {
  return useQuery({
    queryKey: ["following", userId],
    queryFn: () => followingService.getFollowing(userId),
    enabled: !!userId,
  });
}

// Hook to get the follower and following counts for a user
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

// Hook to check if current user is following another.
export function useIsFollowing(userId: string, followingId: string) {
  return useQuery({
    queryKey: ["isFollowing", userId, followingId],
    queryFn: () => followingService.isFollowing(userId, followingId),
    enabled: !!userId && !!followingId,
  });
}

// Hook to get posts from friends of the user.
export function useFriendDiscoverPosts(userId: string) {
  return useQuery({
    queryKey: ["friendDiscoverPosts", userId],
    queryFn: async () => {
      const response = await followingService.getFollowingPosts(userId);
      const posts = response.posts;
      return posts.filter((post) => post.imageUrls && post.imageUrls.length > 0);
    },
    enabled: !!userId,
  });
}


export const useFollowingPosts = (
  currentUserId: string,
  limit = 30,
  region?: { ne: [number, number]; sw: [number, number] }
) => {
  return useInfiniteQuery<
    { posts: Post[]; lastVisible: any },
    Error
  >({
    queryKey: ["followingByUser", currentUserId, limit, region || {}],
    queryFn: async ({ pageParam = undefined }): Promise<{ posts: Post[]; lastVisible: any }> => {
      if (!currentUserId) throw new Error("User not authenticated");
      // Pass the region parameter to your backend service.
      const response = await followingService.getFollowingPostsPaginated(
        currentUserId,
        limit,
        pageParam,
        region
      );
      const posts = response.posts.filter(
        (post: Post) => post.imageUrls && post.imageUrls.length > 0
      );
      return { posts, lastVisible: response.lastVisible };
    },
    getNextPageParam: (lastPage) => lastPage.lastVisible,
    initialPageParam: undefined,
    enabled: !!currentUserId,
  });
};




// Hook to handle follow/unfollow actions
export const useFollowingActions = (
  followingId: string,
  currentUserId: string
) => {
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: ["userCounts", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["userCounts", followingId] });
      queryClient.invalidateQueries({ queryKey: ["following", followingId] });
      queryClient.invalidateQueries({ queryKey: ["isFollowing", currentUserId] }); // Added to update any existing cache for isFollowing
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
      queryClient.invalidateQueries({ queryKey: ["userCounts", currentUserId] });
      queryClient.invalidateQueries({ queryKey: ["userCounts", followingId] });
      queryClient.invalidateQueries({ queryKey: ["following", followingId] });
      queryClient.invalidateQueries({ queryKey: ["isFollowing", currentUserId] }); // Added to update any existing cache for isFollowing
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