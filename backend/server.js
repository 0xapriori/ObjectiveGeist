const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI);

// Configure Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Models
const Post = mongoose.model('Post', {
  id: Number,
  title: String,
  content: String,
  summary: String,
  eli5Summary: String,
  url: String,
  category: String,
  threadId: Number,
  createdAt: Date,
  authorUsername: String,
  authorId: Number,
});

const DailySummary = mongoose.model('DailySummary', {
  date: Date,
  summary: String,
  postIds: [Number],
  uniqueAuthors: [String],
});

// Fetch latest posts from research.anoma.net
async function fetchLatestPosts() {
  try {
    const response = await axios.get('https://research.anoma.net/latest.json');
    return response.data.topic_list.topics;
  } catch (error) {
    console.error('Error fetching latest posts:', error);
    return [];
  }
}

// Fetch a single post with full content
async function fetchPost(postId) {
  try {
    const response = await axios.get(`https://research.anoma.net/t/${postId}.json`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error);
    return null;
  }
}

// Generate ELI5 summary using Google Gemini
async function generateEli5Summary(content) {
  try {
    const cleanContent = content.replace(/<[^>]*>/g, '').substring(0, 3000);
    
    const prompt = `Please provide an ELI5 (Explain Like I'm 5) summary of this technical post from the Anoma Research Forum. Make it simple and easy to understand for non-technical people:

${cleanContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Error generating ELI5 summary:', error);
    return "This post discusses technical aspects of Anoma's research. Check the original post for details.";
  }
}

// Generate daily summary using Google Gemini
async function generateDailySummary(date) {
  try {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const posts = await Post.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    if (posts.length === 0) {
      return null;
    }
    
    const postContents = posts.map(post => post.title + ": " + post.eli5Summary).join("\n\n");
    
    const prompt = `Create a one-paragraph summary of all the following Anoma research posts from ${date.toDateString()}:\n\n${postContents}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    const uniqueAuthors = [...new Set(posts.map(post => post.authorUsername))];
    
    const dailySummary = new DailySummary({
      date: startDate,
      summary: response.text(),
      postIds: posts.map(post => post.id),
      uniqueAuthors: uniqueAuthors,
    });
    
    await dailySummary.save();
    return dailySummary;
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return null;
  }
}

// API endpoints
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(100);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.id });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/threads/:threadId', async (req, res) => {
  try {
    const posts = await Post.find({ threadId: req.params.threadId }).sort({ createdAt: 1 });
    
    let threadSummary = null;
    if (posts.length > 1) {
      const postContents = posts.map(post => post.eli5Summary).join("\n\n");
      
      const prompt = `Create a concise summary of this entire thread from the Anoma Research Forum:\n\n${postContents}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      threadSummary = response.text();
    }
    
    res.json({ posts, threadSummary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/daily-summaries', async (req, res) => {
  try {
    const dailySummaries = await DailySummary.find().sort({ date: -1 }).limit(30);
    res.json(dailySummaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Post.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories/:category', async (req, res) => {
  try {
    const posts = await Post.find({ category: req.params.category }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/users', async (req, res) => {
  try {
    const users = await Post.aggregate([
      {
        $group: {
          _id: '$authorUsername',
          postCount: { $sum: 1 },
          firstPost: { $min: '$createdAt' },
          lastPost: { $max: '$createdAt' },
          categories: { $addToSet: '$category' }
        }
      },
      {
        $project: {
          username: '$_id',
          postCount: 1,
          firstPost: 1,
          lastPost: 1,
          categories: 1,
          _id: 0
        }
      },
      { $sort: { postCount: -1 } }
    ]);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/daily', async (req, res) => {
  try {
    const dailyStats = await Post.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          postCount: { $sum: 1 },
          uniqueAuthors: { $addToSet: '$authorUsername' }
        }
      },
      {
        $project: {
          date: '$_id',
          postCount: 1,
          authorCount: { $size: '$uniqueAuthors' },
          _id: 0
        }
      },
      { $sort: { date: -1 } }
    ]);
    
    res.json(dailyStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scheduled job to fetch and process new posts
async function updatePosts() {
  try {
    const latestPosts = await fetchLatestPosts();
    
    for (const topicInfo of latestPosts) {
      const existingPost = await Post.findOne({ id: topicInfo.id });
      if (existingPost) {
        continue;
      }
      
      const postData = await fetchPost(topicInfo.id);
      if (!postData) {
        continue;
      }
      
      const firstPost = postData.post_stream.posts[0];
      const content = firstPost.cooked;
      
      const eli5Summary = await generateEli5Summary(content);
      
      const post = new Post({
        id: topicInfo.id,
        title: topicInfo.title,
        content: content,
        summary: topicInfo.excerpt,
        eli5Summary: eli5Summary,
        url: `https://research.anoma.net/t/${topicInfo.slug}/${topicInfo.id}`,
        category: postData.category_name,
        threadId: topicInfo.id,
        createdAt: new Date(topicInfo.created_at),
        authorUsername: firstPost.username,
        authorId: firstPost.user_id,
      });
      
      await post.save();
      console.log(`Added post: ${topicInfo.title}`);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingSummary = await DailySummary.findOne({ date: today });
    if (!existingSummary) {
      await generateDailySummary(today);
    }
    
    console.log('Update completed successfully');
  } catch (error) {
    console.error('Error in updatePosts:', error);
  }
}

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Run initial update
updatePosts();
