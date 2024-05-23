const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/mapbox-token', (req, res) => {
  res.json({ accessToken: process.env.MAPBOX_ACCESS_TOKEN });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
