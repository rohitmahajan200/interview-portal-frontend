// src/main.tsx
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { Provider } from 'react-redux';
import { store } from './app/store.js';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from './components/ThemeProvider';

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <ThemeProvider>
      <App />
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        containerStyle={{ 
          zIndex: 999999,
          top: '20px',
        }}
        toastOptions={{
          duration: 4000,
          success: {
            duration: 4000,
            style: {
              background: '#10b981',
              color: 'white',
            },
          },
          error: {
            duration: 6000,
            style: {
              background: '#ef4444',
              color: 'white',
            },
          },
        }}
      />
    </ThemeProvider>
  </Provider>
);
