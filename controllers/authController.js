import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { pool } from '../db/db.js';

const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 587,
    secure: false,
    auth: {
        user: 'thirumalesh579@zohomail.in',
        pass: 'Lp37Y33WyKkN' 
    }
});

async function sendEmail(from, to, subject, text) {
    try {
        const info = await transporter.sendMail({
            to: to,
            from: from,
            subject: subject,
            text: text
        });
        return info.messageId ? true : false;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

function generateRandomHexString(length) {
    const characters = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

const generateToken = (user) => {
    if (!user) {
        throw new Error("User is not provided");
    }

    const tokenPayload = {
        username: user.username,
        role: user.role,
        user_id: user.user_id
    };
    return jwt.sign(tokenPayload, "thirumalesh@79", { expiresIn: "1h" });
}

export const register = async (req, res) => {
    const { name, password, email, role, college, bio, is_past_student, current_year, current_sem } = req.body;
    
    // Set profile_pic to the uploaded file's filename, or use the default if not provided
    const profile_pic = req.file?.filename || 'uploads/profile-pic.jpeg'; 

    if (!name || !password || !email || !role || !college) {
        return res.status(400).json({ message: "Required fields are missing" });
    }

    if (role !== 'student' && role !== 'mentor') {
        return res.status(400).json({ message: "Invalid role specified" });
    }

    if (college !== 'NECN' && college !== 'NECG') {
        return res.status(400).json({ message: "Invalid college specified" });
    }

    if (role === 'student' && !is_past_student && (!current_year || !current_sem)) {
        return res.status(400).json({ message: "Current year and semester are required for current students" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        
        // Check if user exists
        const [existingUsers] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (existingUsers.length > 0) {
            const user = existingUsers[0];
            if (!user.is_verified && user.verification_link) {
                connection.release();
                return res.status(200).json({ message: "Verification link already sent. Please check your email." });
            }
            if (user.is_verified) {
                connection.release();
                return res.status(400).json({ message: "Email already registered" });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationLink = generateRandomHexString(10);
        const verificationUrl = `http://localhost:3000/api/auth/verify/${verificationLink}`;

        const emailSent = await sendEmail("thirumalesh579@zohomail.in", email, "Verify Your Account", `Click here to verify your account: ${verificationUrl}`);
        if (!emailSent) {
            connection.release();
            return res.status(500).json({ message: "Failed to send verification email" });
        }

        try {
            await connection.beginTransaction();
            
            // Insert user
            const [userResult] = await connection.query(
                `INSERT INTO users (name, password, email, role, college, is_verified, verification_link, profile_pic, bio, is_past_student, current_year, current_sem) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, hashedPassword, email, role, college, false, verificationLink, profile_pic, bio || null, is_past_student || false, current_year || null, current_sem || null]
            );

            if (role === 'mentor') {
                await connection.query('INSERT INTO mentors (user_id) VALUES (?)', [userResult.insertId]);
            }

            await connection.commit();
            connection.release();
            return res.status(201).json({ message: "Registration successful. Please check your email for verification." });
            
        } catch (error) {
            await connection.rollback();
            connection.release();
            return res.status(500).json({ message: "Registration failed: " + error.message });
        }
    } catch (error) {
        if (connection) connection.release();
        return res.status(500).json({ message: "Registration failed: " + error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Enter your email and password" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        connection.release();
        
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = users[0];
        
        if (!user.is_verified) {
            return res.status(401).json({ message: "Please verify your account first" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const token = generateToken(user);
        const { password: _, ...userDetails } = user; // Exclude password from response
        
        return res.status(200).json({
            message: "Login successful",
            token,
            role: user.role,
            user_id: user.user_id,
            profile: user.profile_pic, // Include profile picture path
            userDetails
        });
    } catch (error) {
        if (connection) connection.release();
        return res.status(500).json({ message: "Something went wrong! " + error.message });
    }
};

export const verify = async (req, res) => {
    const { link } = req.params;
    if (!link) {
        return res.status(400).json({ message: "Verification link is missing" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        
        const [users] = await connection.query('SELECT * FROM users WHERE verification_link = ?', [link]);
        
        if (users.length === 0) {
            connection.release();
            return res.status(404).json({ message: "Verification link not found" });
        }

        await connection.query('UPDATE users SET is_verified = ?, verification_link = ? WHERE verification_link = ?', [1, null, link]);
        
        connection.release();
        return res.status(200).json({ message: "User verified successfully!" });
    } catch (error) {
        if (connection) connection.release();
        return res.status(500).json({ message: "Something went wrong! " + error.message });
    }
};

export const sendLink = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        
        const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            connection.release();
            return res.status(404).json({ message: "User not found" });
        }

        if (users[0].is_verified) {
            connection.release();
            return res.status(400).json({ message: "Email already verified" });
        }

        const verificationLink = generateRandomHexString(10);
        const verificationUrl = `http://localhost:3000/verify/${verificationLink}`;

        const emailSent = await sendEmail("thirumalesh579@zohomail.in", email, "Verify Your Account", `Click here to verify your account: ${verificationUrl}`);
        if (!emailSent) {
            connection.release();
            return res.status(500).json({ message: "Failed to send verification email" });
        }

        await connection.query('UPDATE users SET verification_link = ? WHERE email = ?', [verificationLink, email]);
        
        connection.release();
        return res.status(200).json({ message: "Verification link sent. Please check your email." });
    } catch (error) {
        if (connection) connection.release();
        return res.status(500).json({ message: "Failed to send verification link: " + error.message });
    }
};