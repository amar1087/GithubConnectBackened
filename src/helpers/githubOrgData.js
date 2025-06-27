const mongoose = require('mongoose');

const commitSchema = new mongoose.Schema({
  sha: String,
  message: String,
  author: {
    name: String,
    email: String,
    date: Date,
  },
}, { _id: false });

const pullRequestSchema = new mongoose.Schema({
  id: Number,
  title: String,
  state: String,
  user: {
    login: String,
  },
  created_at: Date,
  updated_at: Date,
}, { _id: false });

const issueSchema = new mongoose.Schema({
  id: Number,
  title: String,
  state: String,
  user: {
    login: String,
  },
  created_at: Date,
  updated_at: Date,
}, { _id: false });

const repositorySchema = new mongoose.Schema({
  name: String,
  commits: [commitSchema],
  pulls: [pullRequestSchema],
  issues: [issueSchema],
}, { _id: false });

const organizationSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  fetched_at: { type: Date, default: Date.now },
  repositories: [repositorySchema],
});

module.exports = mongoose.model('GitHubOrganization', organizationSchema);
