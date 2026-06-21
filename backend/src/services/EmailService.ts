import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'mock_user',
    pass: process.env.SMTP_PASS || 'mock_pass',
  },
});

const fromEmail = process.env.SMTP_FROM || 'noreply@maraphoto.com';

/**
 * Sends a generic email
 */
export const sendEmail = async (to: string, subject: string, html: string): Promise<any> => {
  // If SMTP is mock, print in console
  if (process.env.SMTP_USER === 'mock_user' || !process.env.SMTP_HOST) {
    console.log(`\n--- [MOCK EMAIL NOTIFICATION] ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html.substring(0, 300)}...`);
    console.log(`----------------------------------\n`);
    return { mock: true, sent: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Mara Photo" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    return info;
  } catch (error: any) {
    console.error('Email Dispatch Error:', error);
    throw new Error(`Email Send Failure: ${error.message}`);
  }
};

/**
 * Sends an OTP email for login verification
 */
export const sendOTPEmail = async (to: string, code: string): Promise<any> => {
  const subject = 'Mara Photo - Your OTP Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #6366f1; text-align: center;">Mara Photo Authentication</h2>
      <p>Hello,</p>
      <p>You requested a verification code to access your account or event. Please use the One-Time Password (OTP) below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; background-color: #f3f4f6; border-radius: 6px; color: #1f2937;">
          ${code}
        </span>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This code is valid for 10 minutes. If you did not make this request, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="text-align: center; color: #9ca3af; font-size: 12px;">Mara Photo © 2026 - Find Every Memory With AI</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

/**
 * Sends an invite to clients for newly created events
 */
export const sendEventInviteEmail = async (
  to: string,
  clientName: string,
  eventName: string,
  galleryLink: string,
  accessType: string,
  password?: string
): Promise<any> => {
  const subject = `Invited to View Event: ${eventName}`;
  const accessDetails = accessType === 'PASSWORD' 
    ? `<p><strong>Access Type:</strong> Password Protected<br/><strong>Password:</strong> ${password}</p>`
    : `<p><strong>Access Type:</strong> ${accessType}</p>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #6366f1; text-align: center;">You have been invited!</h2>
      <p>Dear ${clientName},</p>
      <p>A photography studio has uploaded photos/videos for the event <strong>${eventName}</strong> on Mara Photo.</p>
      ${accessDetails}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${galleryLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
          View Gallery
        </a>
      </div>
      <p>You can instantly find all your photos by uploading a selfie once inside the gallery.</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="text-align: center; color: #9ca3af; font-size: 12px;">Mara Photo © 2026 - Find Every Memory With AI</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};
