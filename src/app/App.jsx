import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginNeocore from './LoginNeocore';
import Dashboard from './Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginNeocore />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
