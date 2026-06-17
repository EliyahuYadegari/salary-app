import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // זה הייבוא שחסר לך
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter> {/* המעטפת הזו פותרת את השגיאה! */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);