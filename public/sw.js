// Service Worker for Push Notifications
const CACHE_NAME = 'change-networks-v1';

// Install event
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Push event handler
self.addEventListener('push', (event) => {
  
  let notificationData;
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (error) {
        notificationData = { title: 'New Notification', body: 'You have a new notification' };
  }

  const {
    title = 'CHANGE Networks',
    body = 'You have a new notification',
    icon = '/icons/notification-icon-192.png',
    badge = '/icons/badge-icon-72.png',
    data = {},
    actions = [],
    tag = 'default',
    requireInteraction = false,
    url = '/'
  } = notificationData;

  const notificationOptions = {
    body,
    icon,
    badge,
    data: { url, ...data },
    actions,
    tag,
    requireInteraction,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    
  const { data } = event.notification;
  const targetUrl = data?.url || '/';

  event.notification.close();

  // Handle action clicks
  if (event.action) {
        
    switch (event.action) {
      case 'view':
        event.waitUntil(
          self.clients.openWindow(targetUrl)
        );
        break;
      case 'later':
        // Handle "remind later" action
                break;
      case 'calendar':
        // Handle "add to calendar" action
                break;
      default:
        event.waitUntil(
          self.clients.openWindow(targetUrl)
        );
    }
    return;
  }

  // Regular notification click
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if there's already a window open
      for (const client of clients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if none exists
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Background sync (optional)
self.addEventListener('sync', (event) => {
  });

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
    
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


// Add to your sw.js
self.addEventListener('pushsubscriptionchange', (event) => {
    // Handle subscription renewal
});

self.addEventListener('error', (event) => {
  });