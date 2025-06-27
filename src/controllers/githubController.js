
const githubService = require('../models/githubService.js');
const dbService = require('../models/dbService.js');
const jwt = require('jsonwebtoken');
const GitHubOrganization = require('../helpers/githubOrgData');

const gitHubController = {
  // Function to handle GitHub OAuth callback and retrieve user data
  getUserData: async (req, res) => {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is missing' });
    }

    try {
      const { userData, accessToken } = await githubService.getUserData(code);
      //  save user data to the database
      const savedUser = await dbService.saveUserToDB(userData);
      // get token for the user
      const token = jwt.sign(
        { id: savedUser.id, login: savedUser.login, name: savedUser.name, avatar: savedUser.avatar_url, createdDate: savedUser.created_at, updatedDate: savedUser.updated_at, accessToken: accessToken },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);

    } catch (error) {
      console.error('Error fetching GitHub user data:', error);
      return res.status(500).json({ error: 'Failed to retrieve user data' });
    }
  },
  // Function to fetch and save GitHub organizations data
  fetchAndSaveGitHubOrgs: async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(' ')[1]; // or retrieve from DB/session
      const result = await githubService.getOrgData(accessToken);
      return res.status(200).json({ message: "GitHub org data saved successfully" });
    } catch (error) {
      console.error('Error saving GitHub org data:', error);
      res.status(500).json({ error: 'Failed to fetch and save GitHub data' });
    }
  },
  // delete user data and all associated organizations
  deleteUserData: async (req, res) => {
    try {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ error: 'User ID is required for deletion' });
      }

      // Run both deletions
      const [userDeleteResult, orgsDeleteResult] = await Promise.all([
        dbService.deleteGitHubUser(id),
        dbService.deleteAllOrgsData()
      ]);

      // Check for user deletion failure
      if (!userDeleteResult.success) {
        return res.status(404).json({ error: userDeleteResult.message || 'User not found' });
      }

      // Check for org deletion failure
      if (!orgsDeleteResult.success) {
        return res.status(404).json({ error: orgsDeleteResult.message || 'Organization deletion failed' });
      }

      // Success
      return res.status(200).json({
        message: 'User and associated organizations deleted successfully',
        userMessage: userDeleteResult.message,
        orgMessage: orgsDeleteResult.message
      });

    } catch (error) {
      console.error('Error in deleteUserData:', error);
      return res.status(500).json({ error: 'Failed to delete user data' });
    }
  },
  // Function to get filtered data based on selected value
  getFilteredData: async (req, res) => {
    try {
      const { orgName, filterType, repoName, state, search } = req.query;

      if (!orgName || !filterType) {
        return res.status(400).json({ error: 'Missing orgName or filterType' });
      }
      // get the organization from the database
      const org = await GitHubOrganization.findOne({ name: orgName });
      if (!org) return res.status(404).json({ error: 'Organization not found' });

      let result = [];
      // Filter repositories based on the provided repoName and filterType
      for (const repo of org.repositories) {
        if (repoName && repo.name !== repoName) continue;

        if (filterType === 'pulls') {
          const filteredPulls = (repo.pulls || []).filter(p => !state || p.state === state);
          result.push(...filteredPulls.map(p => ({ ...p, repoName: repo.name })));
        }

        if (filterType === 'commits') {
          result.push(...(repo.commits || []).map(c => ({ paren: c.$__parent, repoName: repo.name })));
        }

        if (filterType === 'repo') {
          if (!search || repo.name.includes(search)) {
            result.push({
              name: repo.name,
              commitsCount: repo.commits?.length || 0,
              pullsCount: repo.pulls?.length || 0,
              issuesCount: repo.issues?.length || 0,
            });
          }
        }
      }

      res.status(200).json(result);
    } catch (err) {
      console.error('Error filtering GitHub data:', err.message);
      res.status(500).json({ error: 'Server error' });
    }
  }




}

module.exports = gitHubController;