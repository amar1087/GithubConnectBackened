const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const githubService = require('../models/githubService');

// Route to initiate GitHub OAuth login
router.get('/login', githubService.getLoginRedirectUrl); 

// Route to handle OAuth callback
router.get('/callback', githubController.getUserData); 

// Route to fetch Orgs Data
router.get('/getOrgsData', githubController.fetchAndSaveGitHubOrgs); 

// Route to delete user data and associated organizations
router.get('/removeData', githubController.deleteUserData); 

// filter data based on user input
router.get('/filter', githubController.getFilteredData);

module.exports = router;