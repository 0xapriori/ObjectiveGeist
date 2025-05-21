const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');  // ← This line
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI);

// Configure OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
    // Discourse API endpoint for latest posts
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

// Generate ELI5 summary using OpenAI
async function generateEli5Summary(content) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that explains complex topics in simple terms. Provide an ELI5 (Explain Like I'm 5) summary that a non-technical person would understand."
        },
        {
          role: "user",
          content: `Please provide an ELI5 summary of the following text from the Anoma Research Forum:\n\n${content}`
        }
      ],
      max_tokens: 300,
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating ELI5 summary:', error);
    return "Unable to generate summary at this time.";
  }
}

// Generate daily summary
async function generateDailySummary(date) {
  try {
    // Find all posts from the given date
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
    
    // Extract post contents
    const postContents = posts.map(post => post.title + ": " + post.eli5Summary).join("\n\n");
    
    // Generate summary using OpenAI
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise and informative daily summaries."
        },
        {
          role: "user",
          content: `Create a one-paragraph summary of all the following Anoma research posts from ${date.toDateString()}:\n\n${postContents}`
        }
      ],
      max_tokens: 250,
    });
    
    // Get unique authors
    const uniqueAuthors = [...new Set(posts.map(post => post.authorUsername))];
    
    // Create and save the daily summary
    const dailySummary = new DailySummary({
      date: startDate,
      summary: response.data.choices[0].message.content,
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
    
    // If there are multiple posts in the thread, generate a thread summary
    let threadSummary = null;
    if (posts.length > 1) {
      const postContents = posts.map(post => post.eli5Summary).join("\n\n");
      
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates thread summaries."
          },
          {
            role: "user",
            content: `Create a concise summary of this entire thread from the Anoma Research Forum:\n\n${postContents}`
          }
        ],
        max_tokens: 300,
      });
      
      threadSummary = response.data.choices[0].message.content;
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
    // Get user activity stats over time
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
    // Get post counts by day
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
      // Check if post already exists
      const existingPost = await Post.findOne({ id: topicInfo.id });
      if (existingPost) {
        continue;
      }
      
      // Fetch full post data
      const postData = await fetchPost(topicInfo.id);
      if (!postData) {
        continue;
      }
      
      // Process post content (first post in the thread)
      const firstPost = postData.post_stream.posts[0];
      const content = firstPost.cooked; // HTML content
      
      // Generate ELI5 summary
      const eli5Summary = await generateEli5Summary(content);
      
      // Save to database
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
    
    // Generate daily summary for today
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
