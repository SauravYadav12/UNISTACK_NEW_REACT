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
