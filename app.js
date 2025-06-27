const express = require('express');
const connectDB = require('./src/helpers/connectDB');
const cors = require('cors');
const githubRoutes = require('./src/routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
connectDB();

app.use(express.json());
app.use(cors());

app.use(cors({
    origin: process.env.FRONTEND_URL, // Angular dev server
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }));

// 💡 All routes handled here
app.use('/api/github', githubRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

