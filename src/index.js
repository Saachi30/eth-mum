import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { MQTTProvider } from './context/MQTTContext';
import reportWebVitals from './reportWebVitals';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <MQTTProvider>
        <App />
        <ToastContainer position="bottom-right" theme="dark" />
      </MQTTProvider>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
