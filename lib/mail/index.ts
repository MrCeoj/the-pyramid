import nodemailer from "nodemailer";

const user = process.env.SMTP_USER!;
const pass = process.env.SMTP_PASSWORD!;
const host = process.env.SMTP_HOST!;
const portenv = process.env.SMTP_PORT!;

export const transporter = nodemailer.createTransport({
  host,
  port: Number(portenv),
  secure: true,
  auth: {
    user,
    pass,
  },
});
