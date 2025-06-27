const axios = require('axios');
const { Octokit } = require('@octokit/rest');
const dbService = require('./dbService');
require('dotenv').config();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ORG_NAME = process.env.ORG_NAME; // Organization name from environment variables


const githubService = {
    // Function to get user data from GitHub using the access token
    getUserData: async (code) => {
        const tokenResponse = await axios.post(
            process.env.GITHUB_ACCESS_TOKEN_ENDPOINT,
            {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                code,
            },
            {
                headers: {
                    Accept: 'application/json',
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;
        // If the access token is not present, throw an error
        const octokit = new Octokit({ auth: accessToken });
        const { data } = await octokit.rest.users.getAuthenticated();
        return { userData: data, accessToken };
    },

    // Function to get the login redirect URL for GitHub OAuth
    getLoginRedirectUrl: (req, res) => {
        const redirectUrl = `${process.env.GITHUB_OAUTH_URL}?client_id=${CLIENT_ID}&scope=${process.env.GITHUB_SCOPE}`;
        res.redirect(redirectUrl);
    },
    // Function to get the access token from GitHub using the code received after user authorization
    getOrgData: async (accessToken) => {
        console.log("inside getOrgData service", accessToken);
        const octokit = new Octokit({ auth: accessToken });

        const orgsRes = await octokit.rest.orgs.listForAuthenticatedUser();
        const organizations = orgsRes.data;
        console.log("Organizations:", organizations);
        // If no organizations are found, throw an error
        for (const org of organizations) {
            const orgName = org.login;
            const reposRes = await octokit.rest.repos.listForOrg({ org: orgName, type: 'all', per_page: 5 });
            const repositories = await Promise.all(reposRes.data.map(async (repo) => {
                const repoName = repo.name;
                const owner = orgName;
                // Fetching commits, pulls, and issues for each repository
                const commits = await octokit.rest.repos.listCommits({ owner, repo: repoName, per_page: 5 })
                    .then(res => res.data.map(c => ({
                        sha: c.sha,
                        message: c.commit.message,
                        author: {
                            name: c.commit.author.name,
                            email: c.commit.author.email,
                            date: c.commit.author.date,
                        }
                    }))).catch(() => []);
                // Fetching pull requests
                const pulls = await octokit.rest.pulls.list({ owner, repo: repoName, state: 'open', per_page: 5 })
                    .then(res => res.data.map(p => ({
                        id: p.id,
                        title: p.title,
                        state: p.state,
                        user: { login: p.user.login },
                        created_at: p.created_at,
                        updated_at: p.updated_at,
                    }))).catch(() => []);
                // Fetching issues
                const issues = await octokit.rest.issues.listForRepo({ owner, repo: repoName, state: 'open', per_page: 5 })
                    .then(res => res.data.map(i => ({
                        id: i.id,
                        title: i.title,
                        state: i.state,
                        user: { login: i.user.login },
                        created_at: i.created_at,
                        updated_at: i.updated_at,
                    }))).catch(() => []);
                return { name: repoName, commits, pulls, issues };
            }));
            // Saving organization data to the database
            await dbService.saveOrgsDataToDB(orgName, repositories);
        }
    }

};

module.exports = githubService;