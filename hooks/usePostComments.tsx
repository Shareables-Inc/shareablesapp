import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PostService } from "../services/post.service";
import type { PostComment } from "../models/postComments";
import { queryClient } from "../utils/query.client";

const postService = new PostService();

export const usePostComments = (postId: string) => {
	return useQuery({
		queryKey: ["postComments", postId],
		queryFn: () => postService.getCommentsByPostId(postId),
	});
};

export const useCreatePostComment = () => {
	return useMutation({
		mutationFn: (comment: PostComment) => postService.createComment(comment),
		onSuccess: (_, commentId) => {
			queryClient.invalidateQueries({ queryKey: ["postComments", commentId] });
		},
	});
};
