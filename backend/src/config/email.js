import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

export const initializeEmailTransporter = () => {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD // Google App Password: ebln antp lcbk boml
    }
  });

  console.log('✅ Email transporter initialized');
  return transporter;
};

export const getEmailTransporter = () => {
  if (!transporter) {
    return initializeEmailTransporter();
  }
  return transporter;
};

export const sendEmail = async (to, subject, html) => {
  try {
    const emailTransporter = getEmailTransporter();

    const mailOptions = {
      from: `캠핑장 알림 <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
};
