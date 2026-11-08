require('dotenv').config(); // must be first so process.env is filled before other files load

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Allow the Vite frontend (any port) to call this API
app.use(cors());
app.use(express.json());

// --- ERICH PART: Auth & Notification Endpoints ---
app.use('/api/auth', authRoutes);

// Health check endpoint for team integration
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Colloquium Auth & Notification Backend is running!',
  });
});

// Fallback so errors always come back as JSON
app.use((err, req, res, next) => {
  console.error('[Backend] Unhandled error:', err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Backend] Server running on port ${PORT}`);
});