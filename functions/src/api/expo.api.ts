import {
  CommentNotification,
  FollowerNotification,
  LikeNotification,
  PostNotification,
} from "../notification";

export async function sendPushNotifications(
  notifications:
    | CommentNotification
    | CommentNotification[]
    | FollowerNotification
    | FollowerNotification[]
    | LikeNotification
    | LikeNotification[]
    | PostNotification
    | PostNotification[]
): Promise<Response[]> {
  const expoPushUrl = "https://exp.host/--/api/v2/push/send";
  const batchSize = 600;
  const delay = 1000; // 1 second delay between batches

  const notificationsArray = Array.isArray(notifications)
    ? notifications
    : [notifications];

  const responses: Response[] = [];

  for (let i = 0; i < notificationsArray.length; i += batchSize) {
    const batch = notificationsArray.slice(i, i + batchSize);

    const response = await fetch(expoPushUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });

    responses.push(response);

    // If there are more notifications to process, wait before the next batch
    if (i + batchSize < notificationsArray.length) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return responses;
}
