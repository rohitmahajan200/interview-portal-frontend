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
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        containerStyle={{ zIndex: 999999 }}
        toastOptions={{
          style: { zIndex: 999999 },
          duration: 4000,
        }}
      />
      <App />
    </ThemeProvider>
  </Provider>
);
