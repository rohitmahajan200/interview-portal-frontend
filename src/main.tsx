import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./app/store.js";
import { Toaster } from "react-hot-toast";
createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <Toaster
      position="bottom-right" // Change from top-center
      reverseOrder={false}
      containerStyle={{
        zIndex: 999999,
      }}
      toastOptions={{
        style: {
          zIndex: 999999,
        },
        duration: 4000,
      }}
    />
    <App />
  </Provider>
);
