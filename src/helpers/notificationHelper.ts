import { prisma } from "./prisma.js";
import { emitNotification } from "./socketHelper.js";
import { sendPushNotification } from "./firebaseHelper.js";

interface SendNotificationParams {
  email: string;
  type: string;
  title: string;
  message: string;
  relatedRecordId?: string;
  relatedRecordType?: string;
  data?: Record<string, string>;
}

export const sendNotification = async ({
  email,
  type,
  title,
  message,
  relatedRecordId,
  relatedRecordType,
  data = {},
}: SendNotificationParams) => {
  try {
    // 1. Create a notification record in the database
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        related_record_id: relatedRecordId,
        related_record_type: relatedRecordType,
        created_by: email,
      },
    });

    // Find the user to get their ID and fcmToken
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, fcmToken: true },
    });

    if (user) {
      // 2. Emit notification event via Socket.IO
      emitNotification(user.id, {
        id: notification.id,
        type,
        title,
        message,
        related_record_id: relatedRecordId,
        related_record_type: relatedRecordType,
        createdAt: notification.createdAt,
        ...data,
      });

      // 3. Send Firebase Cloud Messaging push notification if FCM Token is available
      if (user.fcmToken) {
        console.log(`[Notification] Sending FCM push to user ID ${user.id} (Token: ${user.fcmToken.substring(0, 10)}...)`);
        
        // Construct standard string-based payload data for Firebase Messaging
        const payloadData: Record<string, string> = {
          notificationId: notification.id,
          type,
        };

        if (relatedRecordId) {
          payloadData.relatedRecordId = relatedRecordId;
        }
        if (relatedRecordType) {
          payloadData.relatedRecordType = relatedRecordType;
        }

        // Add additional metadata
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined && value !== null) {
            payloadData[key] = String(value);
          }
        }

        const success = await sendPushNotification(user.fcmToken, {
          title,
          body: message,
          data: payloadData,
        });

        if (success) {
          console.log(`[Notification] Successfully dispatched FCM push to user ID ${user.id}`);
        } else {
          console.warn(`[Notification] FCM push failed or skipped for user ID ${user.id}`);
        }
      } else {
        console.log(`[Notification] User ID ${user.id} has no registered fcmToken. Push skipped.`);
      }
    } else {
      console.warn(`[Notification] User not found for email ${email}`);
    }

    return notification;
  } catch (error) {
    console.error(`[Notification] Error creating/sending notification to ${email}:`, error);
    throw error;
  }
};
