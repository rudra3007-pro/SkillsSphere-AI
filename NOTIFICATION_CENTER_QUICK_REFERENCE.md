# Notification Center - Quick Reference

## 📍 File Locations

```text
client/src/modules/notifications/
├── hooks/
│   └── useNotifications.js
├── components/
│   ├── NotificationBell.jsx      (Navbar icon)
│   ├── NotificationCard.jsx      (Item display)
│   └── NotificationDropdown.jsx  (Popup)
└── pages/
    └── NotificationsPage.jsx     (/notifications route)
```

## 🎯 Component Usage Examples

### Using useNotifications Hook

```javascript
import useNotifications from "../hooks/useNotifications";

function MyComponent() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    deleteNotification,
    loadMore,
    hasMore,
  } = useNotifications();

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map((notif) => (
        <button key={notif._id} onClick={() => markAsRead(notif._id)}>
          {notif.title}
        </button>
      ))}
      {hasMore && <button onClick={loadMore}>Load More</button>}
    </div>
  );
}
```

### NotificationCard Standalone

```javascript
import NotificationCard from "../components/NotificationCard";

<NotificationCard
  notification={notificationObj}
  onMarkAsRead={(id) => handleRead(id)}
  onDelete={(id) => handleDelete(id)}
  isCompact={false}
/>;
```

### NotificationBell (Already in Navbar)

- Automatically integrated in navbar
- Shows for authenticated users only
- No additional setup needed

## 🔴 Notification Types

```javascript
// Type constants used in backend/UI:
"application-status-updated"; // ✅ Blue
"skill_gap_alert"; // ⚠️  Red
"interview"; // 💬 Purple
"job-match"; // 🎯 Green
"system"; // ⚡ Yellow
"message"; // 💬 Indigo
```

## 📡 Redux Actions

```javascript
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotificationById,
  clearAllNotifications,
} from "../features/notifications/notificationsSlice";

dispatch(getNotifications({ page: 1, limit: 10 }));
dispatch(getUnreadCount());
dispatch(markAsRead(notificationId));
dispatch(markAllAsRead());
dispatch(deleteNotificationById(notificationId));
dispatch(clearAllNotifications());
```

## 🧪 Testing Checklist

- [ ] Bell appears in navbar when logged in
- [ ] Bell disappears when logged out
- [ ] Unread badge shows correct count
- [ ] Dropdown opens/closes on click
- [ ] Dropdown closes on Escape key
- [ ] Dropdown closes on click outside
- [ ] "Mark as read" works on single notification
- [ ] "Mark all as read" works
- [ ] Delete button removes notification
- [ ] "Clear all" removes all notifications
- [ ] Can navigate to /notifications
- [ ] Full page filters work (All/Read/Unread)
- [ ] Pagination loads more notifications
- [ ] Real-time updates work (socket)
- [ ] Responsive on mobile
- [ ] Dark mode works correctly

## 🔗 Routes

```javascript
// Public - Redirects to login if not authenticated
/notifications

// Integrated routes:
/dashboard
/resume-analyzer
/job-matcher
(etc. - navbar visible on all)
```

## ⚙️ Configuration

**Pagination Settings** (in useNotifications.js):

```javascript
dispatch(getNotifications({ page: 1, limit: 10 }));
//                                       ↑ Change limit here
```

**Dropdown Display Count** (in NotificationDropdown.jsx):

```javascript
notifications.slice(0, 5).map(...) // Shows top 5
//                    ↑ Change number here
```

## 🎨 CSS Classes Used

```javascript
// Colors for notification types:
"bg-blue-50 dark:bg-blue-900/30"; // Application Update
"bg-red-50 dark:bg-red-900/30"; // Skill Gap Alert
"bg-purple-50 dark:bg-purple-900/30"; // Interview
"bg-green-50 dark:bg-green-900/30"; // Job Match
"bg-yellow-50 dark:bg-yellow-900/30"; // System
"bg-indigo-50 dark:bg-indigo-900/30"; // Message

// All use Tailwind CSS
```

## 🔐 Authentication

- Components check Redux auth state
- Auto-redirect to login if not authenticated
- ProtectedRoute wrapper on /notifications
- JWT token sent with API requests

## 📊 Redux State Shape

```javascript
store.notifications = {
  items: [
    {
      _id: "507f1f77bcf86cd799439011",
      title: "Application Update",
      message: "Your application has been...",
      type: "application-status-updated",
      isRead: false,
      createdAt: "2024-05-24T10:30:00Z",
      userId: "507f1f77bcf86cd799439010",
    },
    // ... more notifications
  ],
  unreadCount: 3,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 45,
    pages: 5,
  },
};
```

## 🚀 Performance Tips

1. **Use compact mode** in dropdown for better performance
2. **Pagination** prevents loading all notifications at once
3. **Optimistic updates** make UI feel snappy
4. **useMemo** prevents unnecessary re-renders
5. **useCallback** prevents function recreation

## 🆘 Common Issues

| Issue                     | Solution                                    |
| ------------------------- | ------------------------------------------- |
| Bell not showing          | Check `isAuthenticated` prop in Navbar      |
| Notifications not loading | Check Redux token exists                    |
| Real-time not working     | Check SocketNotificationListener is mounted |
| Dropdown won't close      | Check z-index conflicts, try hard refresh   |
| Styling broken            | Check Tailwind CSS is compiled              |
| Dark mode not working     | Check `dark:` classes in Tailwind config    |

## 📞 Debug Commands

```javascript
// In browser console:

// Get Redux state
store.getState().notifications;

// Dispatch action manually
store.dispatch(getNotifications({ page: 1, limit: 10 }));

// Check socket connection
window.__socket; // if exposed by app

// Check auth token
store.getState().auth.token;
```

## 🎯 Typical User Flows

### Flow 1: Quick Check

1. User logs in
2. Sees bell with unread badge
3. Clicks bell → dropdown opens
4. Views last 5 notifications
5. Closes dropdown (ESC key)

### Flow 2: Mark All as Read

1. User logs in
2. Bell shows "5" unread
3. Clicks bell → dropdown opens
4. Clicks "Mark all as read"
5. Badge disappears
6. All notifications become read

### Flow 3: Full Management

1. User logs in
2. Clicks bell
3. Clicks "View all notifications"
4. Full /notifications page loads
5. Filters to "Unread"
6. Selects multiple notifications
7. Clicks delete button
8. Confirms deletion
9. Notifications removed

### Flow 4: Real-Time Notification

1. User has app open
2. Backend sends "new-notification" event
3. Socket listener receives it
4. Redux state updates instantly
5. Bell badge increments
6. Notification appears in dropdown
7. Toast shows in corner

---

**Last Updated**: May 24, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
