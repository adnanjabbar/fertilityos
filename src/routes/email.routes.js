/**
 * Email Routes Controller
 * 
 * Handles email verification endpoints
 */

const express = require('express');
const router = express.Router();
const emailService = require('../services/email.service');
const { authenticateToken } = require('../middleware/auth.middleware');
const db = require('../config/database');

/**
 * GET /api/email/verify/:token
 * Verify email with token
 */
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).send(`
                <html>
                <head><title>Invalid Token</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #dc2626;">❌ Invalid Verification Token</h1>
                    <p>The verification link is invalid.</p>
                </body>
                </html>
            `);
        }

        const result = await emailService.verifyEmailToken(token);

        if (!result.success) {
            return res.status(400).send(`
                <html>
                <head>
                    <title>Verification Failed</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: linear-gradient(135deg, #4f46e5, #9333ea); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); max-width: 500px; text-align: center;">
                        <div style="font-size: 64px; margin-bottom: 20px;">❌</div>
                        <h1 style="color: #dc2626; margin: 0 0 10px 0;">Verification Failed</h1>
                        <p style="color: #6b7280; margin: 0 0 30px 0;">${result.error}</p>
                        <a href="/register-wizard.html" style="display: inline-block; background: linear-gradient(90deg, #4f46e5, #9333ea); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold;">
                            Return to Registration
                        </a>
                    </div>
                </body>
                </html>
            `);
        }

        // Get clinic info for welcome email
        const clinicResult = await db.query(
            `SELECT c.clinic_name, c.subdomain 
             FROM clinics c 
             JOIN users u ON u.clinic_id = c.id 
             WHERE u.id = $1`,
            [result.user.id]
        );

        if (clinicResult.rows.length > 0) {
            const clinic = clinicResult.rows[0];
            // Send welcome email asynchronously (don't wait)
            emailService.sendWelcomeEmail(
                result.user.email,
                result.user.name,
                clinic.clinic_name,
                clinic.subdomain
            ).catch(err => console.error('Error sending welcome email:', err));
        }

        return res.send(`
            <html>
            <head>
                <title>Email Verified!</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: linear-gradient(135deg, #4f46e5, #9333ea); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); max-width: 500px; text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
                    <h1 style="color: #059669; margin: 0 0 10px 0;">Email Verified Successfully!</h1>
                    <p style="color: #4b5563; margin: 0 0 10px 0;">Welcome, ${result.user.name}!</p>
                    <p style="color: #6b7280; margin: 0 0 30px 0; font-size: 14px;">Your account has been activated. You can now log in and start using FertilityOS.</p>
                    <a href="/login.html" style="display: inline-block; background: linear-gradient(90deg, #4f46e5, #9333ea); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Log In to Your Account
                    </a>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).send(`
            <html>
            <head><title>Error</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #dc2626;">❌ Verification Error</h1>
                <p>An error occurred during verification. Please try again later.</p>
            </body>
            </html>
        `);
    }
});

/**
 * POST /api/email/resend-verification
 * Resend verification email
 */
router.post('/resend-verification', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user info
        const userResult = await db.query(
            `SELECT id, email, full_name, email_verified 
             FROM users 
             WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        const user = userResult.rows[0];

        if (user.email_verified) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email already verified' 
            });
        }

        // Send verification email
        await emailService.sendVerificationEmail(user.id, user.email, user.full_name);

        res.json({ 
            success: true, 
            message: 'Verification email sent successfully' 
        });

    } catch (error) {
        console.error('Resend verification email error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error sending verification email' 
        });
    }
});

/**
 * POST /api/email/send-verification
 * Send verification email (for newly registered users)
 */
router.post('/send-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email is required' 
            });
        }

        // Get user info
        const userResult = await db.query(
            `SELECT id, email, full_name, email_verified 
             FROM users 
             WHERE email = $1`,
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        const user = userResult.rows[0];

        if (user.email_verified) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email already verified' 
            });
        }

        // Send verification email
        await emailService.sendVerificationEmail(user.id, user.email, user.full_name);

        res.json({ 
            success: true, 
            message: 'Verification email sent successfully' 
        });

    } catch (error) {
        console.error('Send verification email error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error sending verification email' 
        });
    }
});

module.exports = router;
