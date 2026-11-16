import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useMarkNotificationReadMutation } from '@/redux/api/notification/notificationApi';
import { AppNotification } from '@/redux/api/notification/types';

import { targetOf } from './notificationMeta';

/** Click handler shared by the bell dropdown and the /notifications page: mark read, then go to its target. */
export function useOpenNotification() {
  const navigate = useNavigate();
  const [markRead] = useMarkNotificationReadMutation();

  return useCallback(
    (n: AppNotification) => {
      if (!n.isRead) markRead(n.id);
      const target = targetOf(n);
      if (target) navigate(target.to, target.state ? { state: target.state } : undefined);
    },
    [markRead, navigate],
  );
}
