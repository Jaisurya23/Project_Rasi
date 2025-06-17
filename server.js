require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// --- Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// --- View Engine ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Session Management ---
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Middleware to make session available in all views
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// --- Routes ---
app.use('/', adminRoutes);

// --- Root Redirect ---
// Redirect root to login page if not authenticated, otherwise to dashboard
app.get('/', (req, res) => {
    if (req.session.admin) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});


// --- Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 