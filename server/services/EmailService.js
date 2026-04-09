import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Professional HTML email template
const createEmailTemplate = (content) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notification</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0F6F82 0%, #0A5461 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 40px 30px; background-color: #ffffff; }
        .content h2 { color: #1e293b; margin-top: 0; font-size: 20px; }
        .content p { color: #64748b; line-height: 1.6; margin: 12px 0; }
        .info-box { background-color: #f8fafc; border-left: 4px solid #0F6F82; padding: 16px; margin: 20px 0; border-radius: 6px; }
        .info-box p { margin: 8px 0; color: #334155; }
        .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
        .button { display: inline-block; background-color: #0F6F82; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 500; }
        .warning { color: #dc2626; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Account Notification</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>This is an automated message from your application. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Your Application. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
};

// Email templates for different notification types
export const emailTemplates = {
    loginAlert: (data) => createEmailTemplate(`
        <h2>New Login Detected</h2>
        <p>Hello <strong>${data.userName}</strong>,</p>
        <p class="warning">We detected a new login to your account from an unrecognized device.</p>
        <div class="info-box">
            <p><strong>Device:</strong> ${data.device}</p>
            <p><strong>Browser:</strong> ${data.browser}</p>
            <p><strong>Operating System:</strong> ${data.os}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>IP Address:</strong> ${data.ipAddress}</p>
        </div>
        <p>If this was you, you can safely ignore this email. If you don't recognize this activity, please secure your account immediately.</p>
        <a href="#" class="button">Review Security Settings</a>
    `),

    profileUpdate: (data) => createEmailTemplate(`
        <h2>Profile Updated Successfully</h2>
        <p>Hello <strong>${data.userName}</strong>,</p>
        <p>Your profile has been updated successfully. Here's a summary of the changes:</p>
        <div class="info-box">
            <p><strong>Updated Fields:</strong> ${data.updatedFields}</p>
            <p><strong>Time:</strong> ${data.time}</p>
        </div>
        <p>If you didn't make these changes, please contact support immediately.</p>
    `),

    passwordChange: (data) => createEmailTemplate(`
        <h2>Password Changed</h2>
        <p>Hello <strong>${data.userName}</strong>,</p>
        <p>Your password has been changed successfully.</p>
        <div class="info-box">
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Device:</strong> ${data.device}</p>
        </div>
        <p class="warning">If you didn't make this change, please secure your account immediately.</p>
    `),

    securityAlert: (data) => createEmailTemplate(`
        <h2>Security Alert</h2>
        <p>Hello <strong>${data.userName}</strong>,</p>
        <p class="warning">${data.message}</p>
        <div class="info-box">
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Action Required:</strong> ${data.actionRequired}</p>
        </div>
        <a href="#" class="button">Take Action</a>
    `)
};

// Send email function
export const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"Your Application" <${process.env.EMAIL_USER || 'noreply@yourapp.com'}>`,
            to,
            subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return { success: false, error: error.message };
    }
};

// Wrapper functions for specific email types
export const sendLoginAlertEmail = async (user, deviceData) => {
    const html = emailTemplates.loginAlert({
        userName: user.name,
        ...deviceData
    });
    return sendEmail(user.email, 'New Login Detected - Security Alert', html);
};

export const sendProfileUpdateEmail = async (user, updatedFields) => {
    const html = emailTemplates.profileUpdate({
        userName: user.name,
        updatedFields: updatedFields.join(', '),
        time: new Date().toLocaleString()
    });
    return sendEmail(user.email, 'Profile Updated Successfully', html);
};

export const sendPasswordChangeEmail = async (user, device) => {
    const html = emailTemplates.passwordChange({
        userName: user.name,
        time: new Date().toLocaleString(),
        device: device || 'Unknown'
    });
    return sendEmail(user.email, 'Password Changed', html);
};

export const sendSecurityAlertEmail = async (user, message, actionRequired) => {
    const html = emailTemplates.securityAlert({
        userName: user.name,
        message,
        time: new Date().toLocaleString(),
        actionRequired
    });
    return sendEmail(user.email, 'Security Alert - Action Required', html);
};

export default transporter;
