const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Product = require('../models/Product');

// --- One-time Admin Creation ---
const createAdmin = async () => {
    try {
        const adminExists = await Admin.findOne({ username: process.env.ADMIN_USERNAME });
        if (!adminExists) {
            const admin = new Admin({
                username: process.env.ADMIN_USERNAME,
                password: process.env.ADMIN_PASSWORD
            });
            await admin.save();
            console.log('Admin user created successfully.');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};
createAdmin();

// --- Authentication Middleware ---
const authMiddleware = (req, res, next) => {
    if (req.session.admin) {
        next();
    } else {
        res.redirect('/login');
    }
};

// --- Login Routes ---
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });

        if (admin && (await admin.comparePassword(password))) {
            req.session.admin = admin;
            res.redirect('/dashboard');
        } else {
            res.render('login', { error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred. Please try again.' });
    }
});

// --- Logout Route ---
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.redirect('/login');
    });
});

// --- Dashboard Route ---
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const products = await Product.find({});
        res.render('dashboard', { products });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send("Error fetching products");
    }
});

// --- Product CRUD Routes ---

// GET form to add a product
router.get('/add', authMiddleware, (req, res) => {
    res.render('add-product');
});

// POST to add a new product
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { name, description, price, imageUrl } = req.body;
        const newProduct = new Product({ name, description, price, imageUrl });
        await newProduct.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).send("Error adding product");
    }
});

// GET form to edit a product
router.get('/edit/:id', authMiddleware, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.render('edit-product', { product });
    } catch (error) {
        console.error('Error fetching product for edit:', error);
        res.redirect('/dashboard');
    }
});

// PUT to update a product
router.put('/edit/:id', authMiddleware, async (req, res) => {
    try {
        const { name, description, price, imageUrl } = req.body;
        await Product.findByIdAndUpdate(req.params.id, { name, description, price, imageUrl });
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error updating product:', error);
        res.redirect('/dashboard');
    }
});


// DELETE a product
router.post('/delete/:id', authMiddleware, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error deleting product:', error);
        res.redirect('/dashboard');
    }
});

module.exports = router; 