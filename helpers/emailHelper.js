const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

let transporter = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

function loadTemplate(templateName, replacements) {
  const templatePath = path.join(__dirname, "..", "templates", templateName);
  let html = fs.readFileSync(templatePath, "utf8");

  Object.entries(replacements).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
  });

  return html;
}

async function sendVerificationEmail({ to, name, verificationUrl }) {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.warn("SMTP not configured. Verification URL:", verificationUrl);
    return { sent: false, verificationUrl };
  }

  const html = loadTemplate("verifyEmail.html", {
    name,
    verificationUrl,
    appName: "Auth API",
  });

  await mailTransporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Verify your email address",
    html,
  });

  return { sent: true };
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.warn("SMTP not configured. Reset URL:", resetUrl);
    return { sent: false, resetUrl };
  }

  const html = loadTemplate("resetPassword.html", {
    name,
    resetUrl,
    appName: "Auth API",
  });

  await mailTransporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Reset your password",
    html,
  });

  return { sent: true };
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
