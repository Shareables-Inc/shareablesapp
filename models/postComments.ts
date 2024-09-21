export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorProfilePicture: string;
  comment: string;
  createdAt: Date;
}
