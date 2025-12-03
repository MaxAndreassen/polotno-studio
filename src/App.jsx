import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DesignToolPage from './pages/DesignToolPage';
import DesignDetailPage from './pages/DesignDetailPage';

const App = ({ store }) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/studio" element={<DesignToolPage store={store} />} />
        <Route path="/design/:id" element={<DesignDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
