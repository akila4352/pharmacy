const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', authRoutes);

app.get('/verify-otp', (req, res) => {
    const { email } = req.query;
    res.render('verify-otp', { email });
});

app.listen(3000, () => console.log('Server running on port 3000'));
