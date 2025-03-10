const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
    console.error("JWT_SECRET is not defined in the environment variables.");
    process.exit(1);
}

exports.signup = async (req, res) => {
    const { name, email, password, contactNumber } = req.body;
    console.log("Signup request:", { name, email, contactNumber });

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            contactNumber: contactNumber || null,
        });

        await newUser.save();
        console.log("User created:", { id: newUser._id, email });

        const token = jwt.sign(
            { id: newUser._id, email: newUser.email },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                contactNumber: newUser.contactNumber,
            },
        });
    } catch (err) {
        console.error("Signup error:", err.message, err.stack);
        res.status(500).json({ error: "Server error during signup", details: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log("Login request:", { email });

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                contactNumber: user.contactNumber,
            },
        });
    } catch (err) {
        console.error("Login error:", err.message, err.stack);
        res.status(500).json({ error: "Server error during login", details: err.message });
    }
};