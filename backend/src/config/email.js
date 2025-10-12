import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

let transporter = null;

export const initializeEmailTransporter = () => {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });

  logger.info('Email transporter initialized');
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
    logger.info(`Email sent to ${to}`, { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error('Email send error', { error: error.message, to });
    throw error;
  }
};
