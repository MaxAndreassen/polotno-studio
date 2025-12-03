import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DesignToolPage from './pages/DesignToolPage';

const App = ({ store }) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/studio" element={<DesignToolPage store={store} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
