import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import './CategoryList.css';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories`);
        setCategories(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch categories. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="category-list-page">
      <header className="page-header">
        <h1>Categories</h1>
        <p>Browse posts by category</p>
      </header>
      
      <div className="categories-grid">
        {categories.map(category => (
          <Link 
            to={`/category/${encodeURIComponent(category)}`}
            key={category}
            className="category-card"
          >
            <h2>{category}</h2>
            <div className="card-arrow">→</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
