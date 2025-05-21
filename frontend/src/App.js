import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import ThreadDetail from './pages/ThreadDetail';
import CategoryList from './pages/CategoryList';
import CategoryDetail from './pages/CategoryDetail';
import DailySummaries from './pages/DailySummaries';
import UserStats from './pages/UserStats';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/thread/:id" element={<ThreadDetail />} />
            <Route path="/categories" element={<CategoryList />} />
            <Route path="/category/:category" element={<CategoryDetail />} />
            <Route path="/daily-summaries" element={<DailySummaries />} />
            <Route path="/stats/users" element={<UserStats />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
