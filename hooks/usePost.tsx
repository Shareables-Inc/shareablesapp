import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { PostService } from "../services/post.service";
import type { TopPoster } from "../services/post.service";
import type { FirebasePost, Post } from "../models/post";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import FastImage from "react-native-fast-image";
import { queryClient } from "../utils/query.client";

const postService = new PostService();

// Fetch all posts
export const usePostPaginated = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: ["infinitePosts", limit],
    queryFn: async ({ pageParam }) => {
      const result = await postService.getPostsPaginated(
        limit,
        pageParam as QueryDocumentSnapshot<DocumentData> | undefined
      );

      // Filter out invalid posts and ensure all required fields are present
      const validPosts = result.posts.filter((post) => {
        return (
          post &&
          post.id &&
          post.imageUrls &&
          Array.isArray(post.imageUrls) &&
          post.imageUrls.length > 0 &&
          post.profilePicture
        );
      });

      // Preload images for this page
      const imagesToPreload = validPosts.flatMap((post) => [
        { uri: post.profilePicture },
        ...post.imageUrls.map((url) => ({ uri: url })),
      ]);
      FastImage.preload(imagesToPreload);

      // remove any post that are missing a imageUrl
      return {
        ...result,
        posts: validPosts,
      };
    },

    getNextPageParam: (lastPage: {
      lastVisible?: QueryDocumentSnapshot<DocumentData>;
    }) => lastPage.lastVisible,
    initialPageParam: undefined,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
};

export const usePostById = (postId: string) => {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => postService.getPost(postId),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    enabled: !!postId,
  });
};

// Fetch posts by user
export function usePostsByUser(userId: string): UseQueryResult<Post[], Error> {
  return useQuery({
    queryKey: ["userPosts", userId],
    queryFn: () => postService.getPostsByUser(userId),
    enabled: !!userId,
    refetchOnWindowFocus: true,
  });
}

// Create a new post

export function useCreatePost(): UseMutationResult<string, Error, Post> {
  return useMutation({
    mutationFn: (newPost: Post) => postService.createPost(newPost),
    onSuccess: (newPostId: string) => {
      // Update the cache with the new post
      queryClient.invalidateQueries({ queryKey: ["posts", newPostId] });
      queryClient.invalidateQueries({ queryKey: ["infinitePosts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });
}

// Update a post
export function useUpdatePost(): UseMutationResult<
  void,
  Error,
  { id: string; establishmentId: string; data: Partial<Post> }
> {
  return useMutation({
    mutationFn: ({ id, establishmentId, data }) =>
      postService.updatePost(id, establishmentId, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["posts", id] });
      queryClient.invalidateQueries({ queryKey: ["post", id] });
      queryClient.invalidateQueries({ queryKey: ["infinitePosts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      queryClient.invalidateQueries({ queryKey: ["userLikes", id] });
    },
  });
}

// Delete a post
export function useDeletePost(): UseMutationResult<void, Error, string> {
  return useMutation({
    mutationFn: (id) => postService.deletePost(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", deletedId] });
    },
  });
}

// get top posters
export function useTopPosters(): UseQueryResult<TopPoster[], Error> {
  return useQuery({
    queryKey: ["topPosters"],
    queryFn: () => postService.getTopPosters(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// Get number of posts
export function useNumberOfPosts(
  userId: string
): UseQueryResult<number, Error> {
  return useQuery({
    queryKey: ["numberOfPosts", userId],
    queryFn: () => postService.getNumberOfPosts(userId),
  });
}

// Get most recent posts
export function useMostRecentPosts(
  userId: string
): UseQueryResult<Post[], Error> {
  return useQuery({
    queryKey: ["mostRecentPosts", userId],
    queryFn: () => postService.getMostRecentPosts(userId),
  });
}

// Get top posts
export function useTopPosts(): UseQueryResult<Post[], Error> {
  return useQuery({
    queryKey: ["topPosts"],
    queryFn: () => postService.getTopPosts(),
  });
}
