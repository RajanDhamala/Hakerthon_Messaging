import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,      // your Gmail address
    pass: process.env.PASSWORD,   // app password, NOT your Gmail login
  },
});

export default transporter;
