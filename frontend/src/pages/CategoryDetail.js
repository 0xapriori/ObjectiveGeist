import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './CategoryDetail.css';

const CategoryDetail = () => {
  const { category } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories/${category}`);
        setPosts(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch posts. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, [category]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="category-detail-page">
      <div className="category-navigation">
        <Link to="/categories" className="back-link">← Back to Categories</Link>
      </div>
      
      <header className="category-header">
        <h1>{decodeURIComponent(category)}</h1>
        <p>{posts.length} posts</p>
      </header>
      
      {posts.length === 0 ? (
        <div className="no-posts-message">
          No posts found in this category.
        </div>
      ) : (
        <div className="category-posts">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryDetail;
