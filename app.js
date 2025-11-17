const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const recordsRoutes = require('./routes/route');
const pageRoute = require('./routes/pageRoute');

const path = require('path');

const app = express();

app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'templates'));

const BASE_PATH =
  process.env.isDev == 0 ? path.join(__dirname, '..') : path.join(__dirname);

app.set('views', [
  path.join(BASE_PATH, 'templates'),
]);

app.use(cors());
app.use(bodyParser.json());
app.use('/api', recordsRoutes);
app.use('/', pageRoute);
app.use('/static', express.static('public/static'));
app.use('/js', express.static(path.join(BASE_PATH, 'public/js')));

app.use('/css', express.static(path.join(BASE_PATH, 'public/css')));

app.get('/', (req, res) => {
  res.render('login');
});

//Added by DevOps Team
app.get('/emr', (req, res) => {
  res.send('EMR Catalog Backend API is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
