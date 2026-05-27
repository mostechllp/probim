import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./store";
import "./index.css";
import App from "./App.jsx";
import { LoadingProvider } from "./context/LoadingContext.jsx";
import { Toaster } from "react-hot-toast";
import 'leaflet/dist/leaflet.css';

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <LoadingProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#2ecc71',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#e74c3c',
                  secondary: '#fff',
                },
              },
            }}
          />
          <App />
        </LoadingProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);