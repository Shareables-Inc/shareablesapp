interface Notification {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: {
    id: string;
    screen: string;
    profilePicture: string;
  };
}

export interface CommentNotification extends Notification {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: {
    id: string;
    screen: string;
    postId: string;
    commentId: string;
    profilePicture: string;
  };
}

export interface FollowerNotification extends Notification {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: {
    id: string;
    screen: string;
    userId: string;
    profilePicture: string;
  };
}

export interface LikeNotification extends Notification {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: {
    id: string;
    screen: string;
    postId: string;
    profilePicture: string;
  };
}

export interface PostNotification extends Notification {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: {
    id: string;
    screen: string;
    postId: string;
    profilePicture: string;
  };
}
