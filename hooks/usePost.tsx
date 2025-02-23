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
export const usePostPaginated = (limit = 20) => {
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
          post.imageUrls.length > 0 && // Ensure there is at least 1 image
          post.profilePicture && // Ensure the profile picture is present
          post.review && post.review.trim().length > 0 && // Ensure review text is present
          post.ratings && // Ensure ratings object is present
          post.ratings.ambiance !== undefined &&
          post.ratings.foodQuality !== undefined &&
          post.ratings.service !== undefined // Ensure scores for all ratings are present
        );
      });

      // Preload images for this page
      const imagesToPreload = validPosts.flatMap((post) => [
        { uri: post.profilePicture },
        ...post.imageUrls.map((url) => ({ uri: url })),
      ]);
      FastImage.preload(imagesToPreload);

      // Return only valid posts
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


export function usePostsByUser(userId: string, limit = 6) {
  return useInfiniteQuery<
    { posts: Post[]; lastVisible: QueryDocumentSnapshot<DocumentData> | undefined },
    Error,
    { posts: Post[]; lastVisible: QueryDocumentSnapshot<DocumentData> | undefined },
    (string | number)[]
  >({
    queryKey: ["userPosts", userId, limit],
    queryFn: async ({ pageParam = undefined }) => {
      const result = await postService.getPostsByUserPaginated(
        userId,
        limit,
        pageParam as QueryDocumentSnapshot<DocumentData> | undefined
      );

      const validPosts = result.posts.filter(
        (post) => post.imageUrls && post.imageUrls.length > 0
      );

      const imagesToPreload = validPosts.flatMap((post) => [
        { uri: post.profilePicture },
        ...post.imageUrls.map((url) => ({ uri: url })),
      ]);
      FastImage.preload(imagesToPreload);

      return {
        posts: validPosts,
        lastVisible: result.lastVisible,
      };
    },
    getNextPageParam: (lastPage) => lastPage.lastVisible,
    enabled: !!userId,
    initialPageParam: undefined,
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

export function useUpdatePostRestaurant(): UseMutationResult<
  void,
  Error,
  { id: string; establishmentId: string; data: Partial<Post> }
> {
  return useMutation({
    mutationFn: ({ id, establishmentId, data }) =>
      postService.updatePostRestaurant(id, establishmentId, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["posts", id] });
      queryClient.invalidateQueries({ queryKey: ["post", id] });
      queryClient.invalidateQueries({ queryKey: ["infinitePosts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      queryClient.invalidateQueries({ queryKey: ["userLikes", id] });
    },
  });
}

// edit a post
export function useEditPost(): UseMutationResult<
  void,
  Error,
  { id: string; establishmentId: string; data: Partial<Post> }
> {
  return useMutation({
    mutationFn: ({ id, establishmentId, data }) =>
      postService.editPost(id, establishmentId, data),
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
    queryFn: async () => {
      const posts = await postService.getMostRecentPosts(userId);
      // Filter out posts without images
      return posts.filter((post) => post.imageUrls.length > 0);
    },
  });
}


// Get top posts
export function useTopPosts(): UseQueryResult<Post[], Error> {
  return useQuery({
    queryKey: ["topPosts"],
    queryFn: async () => {
      const posts = await postService.getTopPosts();
      // Filter out posts without images
      return posts.filter((post) => post.imageUrls.length > 0);
    },
  });
}