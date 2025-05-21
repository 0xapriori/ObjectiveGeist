import React from 'react';
import { Link } from 'react-router-dom';
import './PostCard.css';

const PostCard = ({ post }) => {
  const createdDate = new Date(post.createdAt).toLocaleDateString();

  return (
    <div className="post-card">
      <h3 className="post-title">
        <Link to={`/post/${post.id}`}>{post.title}</Link>
      </h3>
      <div className="post-meta">
        <span className="post-category">{post.category}</span>
        <span className="post-date">{createdDate}</span>
        <span className="post-author">{post.authorUsername}</span>
      </div>
      <p className="post-summary">{post.eli5Summary}</p>
      <div className="post-actions">
        <Link to={`/post/${post.id}`} className="read-more">
          Read more
        </Link>
        <Link to={`/thread/${post.threadId}`} className="view-thread">
          View full thread
        </Link>
      </div>
    </div>
  );
};

export default PostCard;
