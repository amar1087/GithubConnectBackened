const userSchema = require('../helpers/userSchema.js');
const GitHubOrganization = require('../helpers/githubOrgData.js');

const dbService = {
  // Function to save user data to MongoDB
  saveUserToDB: async (userData) => {
    try {
      //Check if user already exists
      let existingUser = await userSchema.findOne({ id: userData.id });
      if (existingUser) {
        console.log('User already exists:', existingUser.login);
        return existingUser;
      }
      else {
        // Create new user
        const newUser = new userSchema(userData);
        await newUser.save();
        console.log('User saved to MongoDB:', newUser.login);
        return newUser;
      }


    } catch (error) {
      console.error('Failed to save user:', error.message);
      throw error;
    }
  },
  // Function to save organization data to MongoDB
  saveOrgsDataToDB: async (orgName, repositories) => {
    try {
      const updatedOrg = await GitHubOrganization.findOneAndUpdate(
        { name: orgName },
        {
          name: orgName,
          fetched_at: new Date(),
          repositories,
        },
        { upsert: true, new: true }
      );
      console.log(`Organization ${orgName} saved/updated.`);
      return updatedOrg;

    } catch (error) {
      console.error('Failed to save Orgs Data:', error.message);
      throw error;
    }
  },
  //  Function to get user data from MongoDB
  deleteGitHubUser: async (id) => {
    try {
      const deleted = await userSchema.deleteOne({ id });

      if (deleted.deletedCount > 0) {
        console.log('✅ User deleted:', id);
        return { success: true, message: 'User deleted' };
      } else {
        console.log('⚠️ User not found:', id);
        return { success: false, message: 'User not found' };
      }

    } catch (err) {
      console.error('Failed to delete user:', err.message);
      throw new Error('Database error: ' + err.message);
    }
  },
  // Function to delete organization data from MongoDB
  deleteAllOrgsData: async () => {
    try {
      const result = await GitHubOrganization.deleteMany({});
      console.log(`Deleted ${result.deletedCount} organization(s).`);
      return result;
    } catch (error) {
      console.error('Failed to delete all orgs data:', error.message);
      throw error;
    }
  }

}
module.exports = dbService;
