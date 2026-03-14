/**
 * Email Service
 * 
 * Handles sending emails using nodemailer
 * Supports verification emails, welcome emails, and invoices
 */

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('../config/database');

// Create transporter instance
let transporter = null;

/**
 * Initialize email transporter
 */
const initializeTransporter = () => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.warn('Email service not configured. Set SMTP_* environment variables.');
        return null;
    }

    try {
        transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
        return transporter;
    } catch (error) {
        console.error('Error initializing email transporter:', error);
        return null;
    }
};

/**
 * Get or create transporter
 */
const getTransporter = () => {
    if (!transporter) {
        transporter = initializeTransporter();
    }
    return transporter;
};

/**
 * Generate verification token
 */
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (userId, email, fullName) => {
    try {
        const transporter = getTransporter();
        if (!transporter) {
            throw new Error('Email service not configured');
        }

        // Generate token
        const token = generateVerificationToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store token in users table
        await db.query(
            `UPDATE users 
             SET verification_token = $1, verification_token_expires_at = $2
             WHERE id = $3`,
            [token, expiresAt, userId]
        );

        // Store in email_verifications table
        await db.query(
            `INSERT INTO email_verifications (user_id, email, token, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [userId, email, token, expiresAt]
        );

        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const verificationLink = new URL(`/api/email/verify/${token}`, appUrl).href;

        // Email HTML template
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - FertilityOS</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4f46e5 0%, #9333ea 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">FertilityOS</h1>
                            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Verify Your Email Address</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hello ${fullName}!</h2>
                            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                Thank you for registering with FertilityOS. To complete your registration and activate your account, 
                                please verify your email address by clicking the button below.
                            </p>
                            
                            <!-- Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${verificationLink}" 
                                   style="display: inline-block; background: linear-gradient(90deg, #4f46e5 0%, #9333ea 100%); 
                                          color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; 
                                          font-weight: bold; font-size: 16px;">
                                    Verify Email Address
                                </a>
                            </div>
                            
                            <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="color: #4f46e5; word-break: break-all; margin: 10px 0 0 0; font-size: 14px;">
                                ${verificationLink}
                            </p>
                            
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0 0 0; border-radius: 4px;">
                                <p style="color: #92400e; margin: 0; font-size: 14px;">
                                    <strong>⚠️ Important:</strong> This link will expire in 24 hours for security reasons.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
                                If you didn't create an account with FertilityOS, you can safely ignore this email.
                            </p>
                            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                © ${new Date().getFullYear()} FertilityOS. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        // Send email
        await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'FertilityOS'}" <${process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
            to: email,
            subject: 'Verify Your Email - FertilityOS',
            html: html
        });

        return { success: true, token };

    } catch (error) {
        console.error('Send verification email error:', error);
        throw error;
    }
};

/**
 * Verify email token
 */
const verifyEmailToken = async (token) => {
    try {
        // Check token exists and not expired
        const result = await db.query(
            `SELECT ev.*, u.id as user_id, u.email, u.full_name, u.clinic_id
             FROM email_verifications ev
             JOIN users u ON ev.user_id = u.id
             WHERE ev.token = $1 AND ev.expires_at > NOW() AND ev.verified_at IS NULL`,
            [token]
        );

        if (result.rows.length === 0) {
            return { 
                success: false, 
                error: 'Invalid or expired verification token' 
            };
        }

        const verification = result.rows[0];

        // Mark email as verified
        await db.query(
            `UPDATE users 
             SET email_verified = true, 
                 email_verified_at = NOW(),
                 verification_token = NULL,
                 verification_token_expires_at = NULL,
                 is_active = true
             WHERE id = $1`,
            [verification.user_id]
        );

        // Mark verification record as completed
        await db.query(
            `UPDATE email_verifications 
             SET verified_at = NOW()
             WHERE token = $1`,
            [token]
        );

        // Log audit
        await db.query(
            `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [verification.clinic_id, verification.user_id, 'clinic_staff', 'EMAIL_VERIFIED', 'users', verification.user_id]
        );

        return { 
            success: true, 
            user: {
                id: verification.user_id,
                email: verification.email,
                name: verification.full_name
            }
        };

    } catch (error) {
        console.error('Verify email token error:', error);
        throw error;
    }
};

/**
 * Send welcome email after verification
 */
const sendWelcomeEmail = async (email, fullName, clinicName, subdomain) => {
    try {
        const transporter = getTransporter();
        if (!transporter) {
            console.warn('Email service not configured, skipping welcome email');
            return { success: false, error: 'Email service not configured' };
        }

        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const loginUrl = `${appUrl}/login.html`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to FertilityOS</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #4f46e5 0%, #9333ea 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎉 Welcome to FertilityOS!</h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hello ${fullName}!</h2>
                            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                Congratulations! Your clinic <strong>${clinicName}</strong> has been successfully registered on FertilityOS.
                            </p>
                            
                            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                                <p style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">
                                    Your Clinic Details:
                                </p>
                                <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.6;">
                                    <strong>Clinic Name:</strong> ${clinicName}<br>
                                    <strong>Subdomain:</strong> ${subdomain}<br>
                                    <strong>Login URL:</strong> <a href="${loginUrl}" style="color: #4f46e5;">${loginUrl}</a>
                                </p>
                            </div>
                            
                            <h3 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 20px;">Next Steps:</h3>
                            <ol style="color: #4b5563; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
                                <li>Log in to your account</li>
                                <li>Complete your clinic profile</li>
                                <li>Add your staff members</li>
                                <li>Start managing your patients</li>
                            </ol>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${loginUrl}" 
                                   style="display: inline-block; background: linear-gradient(90deg, #4f46e5 0%, #9333ea 100%); 
                                          color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; 
                                          font-weight: bold; font-size: 16px;">
                                    Log In to Your Account
                                </a>
                            </div>
                            
                            <p style="color: #6b7280; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px;">
                                If you have any questions or need assistance, please don't hesitate to contact our support team.
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                © ${new Date().getFullYear()} FertilityOS. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'FertilityOS'}" <${process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
            to: email,
            subject: `Welcome to FertilityOS - ${clinicName}`,
            html: html
        });

        return { success: true };

    } catch (error) {
        console.error('Send welcome email error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send invoice email
 */
const sendInvoiceEmail = async (email, clinicName, invoiceData) => {
    try {
        const transporter = getTransporter();
        if (!transporter) {
            console.warn('Email service not configured, skipping invoice email');
            return { success: false, error: 'Email service not configured' };
        }

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - FertilityOS</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px;">
                            <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 28px;">Invoice</h1>
                            <p style="color: #6b7280; margin: 0; font-size: 14px;">Invoice #${invoiceData.invoiceNumber}</p>
                            
                            <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 30px 0;">
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="50%" style="vertical-align: top;">
                                        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px;">Billed To:</p>
                                        <p style="color: #1f2937; margin: 0; font-size: 16px; font-weight: bold;">${clinicName}</p>
                                    </td>
                                    <td width="50%" style="vertical-align: top; text-align: right;">
                                        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px;">Issue Date:</p>
                                        <p style="color: #1f2937; margin: 0; font-size: 16px;">${new Date(invoiceData.issuedAt).toLocaleDateString()}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td style="background-color: #f9fafb; padding: 12px; border-bottom: 2px solid #e5e7eb;">
                                        <strong style="color: #1f2937; font-size: 14px;">Description</strong>
                                    </td>
                                    <td style="background-color: #f9fafb; padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">
                                        <strong style="color: #1f2937; font-size: 14px;">Amount</strong>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
                                        <span style="color: #4b5563; font-size: 14px;">
                                            FertilityOS ${invoiceData.planName} Plan - ${invoiceData.billingCycle}
                                        </span>
                                    </td>
                                    <td style="padding: 16px; text-align: right; border-bottom: 1px solid #e5e7eb;">
                                        <span style="color: #4b5563; font-size: 14px;">
                                            ${invoiceData.currency} ${invoiceData.amount.toFixed(2)}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px;">
                                        <strong style="color: #1f2937; font-size: 16px;">Total</strong>
                                    </td>
                                    <td style="padding: 16px; text-align: right;">
                                        <strong style="color: #1f2937; font-size: 18px;">
                                            ${invoiceData.currency} ${invoiceData.amount.toFixed(2)}
                                        </strong>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 30px 0; border-radius: 4px;">
                                <p style="color: #065f46; margin: 0; font-size: 14px;">
                                    <strong>✓ Payment Received:</strong> Thank you for your payment!
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
                                Questions about this invoice? Contact us at support@fertilityos.com
                            </p>
                            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                © ${new Date().getFullYear()} FertilityOS. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'FertilityOS'}" <${process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
            to: email,
            subject: `Invoice ${invoiceData.invoiceNumber} - FertilityOS`,
            html: html
        });

        return { success: true };

    } catch (error) {
        console.error('Send invoice email error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendVerificationEmail,
    verifyEmailToken,
    sendWelcomeEmail,
    sendInvoiceEmail,
    generateVerificationToken
};
