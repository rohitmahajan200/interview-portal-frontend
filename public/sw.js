// Service Worker for Push Notifications
const CACHE_NAME = 'change-networks-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push event handler
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received:', event.data?.text());
  
  let notificationData;
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('Failed to parse push data:', error);
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
  console.log('🖱️ Notification clicked:', event.notification);
  
  const { data } = event.notification;
  const targetUrl = data?.url || '/';

  event.notification.close();

  // Handle action clicks
  if (event.action) {
    console.log('Action clicked:', event.action);
    
    switch (event.action) {
      case 'view':
        event.waitUntil(
          self.clients.openWindow(targetUrl)
        );
        break;
      case 'later':
        // Handle "remind later" action
        console.log('User chose to be reminded later');
        break;
      case 'calendar':
        // Handle "add to calendar" action
        console.log('User wants to add to calendar');
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
  console.log('🔄 Background sync triggered:', event.tag);
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('📨 Message received in SW:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


// Add to your sw.js
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed');
  // Handle subscription renewal
});

self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});