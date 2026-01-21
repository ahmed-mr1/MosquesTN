import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Mosques from './pages/Mosques';
import Suggestions from './pages/Suggestions';
import Reviews from './pages/Reviews';
import Edits from './pages/Edits';
import Moderation from './pages/Moderation';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/mosques" element={<Mosques />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/edits" element={<Edits />} />
          <Route path="/moderation" element={<Moderation />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
