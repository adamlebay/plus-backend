const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const signup = async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const { user, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;

        const userId = uuidv4();
        await db.query('INSERT INTO users (id, name, email) VALUES ($1, $2, $3)', [userId, name, email]);

        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { user, error } = await supabase.auth.signIn({
            email,
            password,
        });

        if (error) throw error;

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const logout = async (req, res) => {
    try {
        await supabase.auth.signOut();
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    signup,
    login,
    logout
};