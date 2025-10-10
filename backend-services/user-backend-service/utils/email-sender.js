import nodemailer from "nodemailer";
import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;
const OAuth2_client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
);
OAuth2_client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const accessToken = await OAuth2_client.getAccessToken();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    type: "OAUTH2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
    accessToken: accessToken,
  },
});

export async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || "MyApp"}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error("Failed to send email: ", error);
    throw error;
  }
}
