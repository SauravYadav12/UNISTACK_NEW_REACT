import { axiosClient } from '../config/axios.config';
import { ApiQueryRes } from '../Interfaces/apiRes';
import {
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
} from '../Interfaces/notification';

export async function listNotifications(opts?: {
  unreadOnly?: boolean;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (opts?.unreadOnly) qs.set('unreadOnly', 'true');
  if (opts?.limit) qs.set('limit', String(opts.limit));
  const s = qs.toString();
  return axiosClient.get<ApiQueryRes<NotificationListResponse>>(
    `/notifications${s ? `?${s}` : ''}`,
  );
}

export async function getUnreadCount() {
  return axiosClient.get<ApiQueryRes<UnreadCountResponse>>(
    `/notifications/unread-count`,
  );
}

export async function markNotificationRead(id: string) {
  return axiosClient.patch<ApiQueryRes<NotificationItem>>(
    `/notifications/${id}/read`,
  );
}

export async function markAllNotificationsRead() {
  return axiosClient.patch<ApiQueryRes<{ updated: number }>>(
    `/notifications/read-all`,
  );
}

/**
 * Hard-delete a single notification. The drawer fires this as a
 * background promise after optimistically removing the row from
 * local state — callers don't need to await the response.
 */
export async function deleteNotification(id: string) {
  return axiosClient.delete<ApiQueryRes<{ deleted: number }>>(
    `/notifications/${id}`,
  );
}

/**
 * Hard-delete every notification for the caller. Same fire-and-forget
 * semantics as deleteNotification.
 */
export async function deleteAllNotifications() {
  return axiosClient.delete<ApiQueryRes<{ deleted: number }>>(
    `/notifications`,
  );
}
