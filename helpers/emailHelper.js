const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

let mailConfigPromise = null;

function hasSmtpCredentials() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function useEtherealFallback() {
  return process.env.MAIL_MODE === "ethereal";
}

function createSmtpTransporter() {
  const auth = {
    user: process.env.SMTP_USER,
    pass: (process.env.SMTP_PASS || "").replace(/\s/g, ""),
  };

  if (process.env.SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth,
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth,
  });
}

async function getMailConfig() {
  if (mailConfigPromise) {
    return mailConfigPromise;
  }

  mailConfigPromise = (async () => {
    if (hasSmtpCredentials()) {
      const transporter = createSmtpTransporter();

      await transporter.verify();

      console.log("\n--- Mail ready (real inbox delivery) ---");
      console.log("Sender:", process.env.SMTP_FROM || process.env.SMTP_USER);
      console.log("Registration emails will be delivered to the user's inbox.\n");

      return {
        transporter,
        from: process.env.SMTP_FROM || `"Auth API" <${process.env.SMTP_USER}>`,
        mode: "smtp",
      };
    }

    if (useEtherealFallback()) {
      const testAccount = await nodemailer.createTestAccount();

      console.log("\n--- Dev mail (Ethereal preview only) ---");
      console.log("Set SMTP_USER + SMTP_PASS in .env to deliver to real inboxes.\n");

      return {
        transporter: nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        }),
        from: `"Auth API" <${testAccount.user}>`,
        mode: "ethereal",
      };
    }

    console.warn("\n--- Mail not configured ---");
    console.warn("Add Gmail (or other SMTP) credentials to .env to send registration emails.");
    console.warn("See .env.example for setup steps.\n");

    return null;
  })().catch((error) => {
    mailConfigPromise = null;
    throw error;
  });

  return mailConfigPromise;
}

async function initEmailTransport() {
  try {
    return await getMailConfig();
  } catch (error) {
    console.error("Mail transport failed:", error.message);
    if (process.env.SMTP_SERVICE === "gmail") {
      console.error(
        "Gmail tip: enable 2-Step Verification, then create an App Password at https://myaccount.google.com/apppasswords"
      );
    }
    return null;
  }
}

function loadTemplate(templateName, replacements) {
  const templatePath = path.join(__dirname, "..", "templates", templateName);
  let html = fs.readFileSync(templatePath, "utf8");

  Object.entries(replacements).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
  });

  return html;
}

async function sendMail({ to, subject, html }) {
  const config = await getMailConfig();

  if (!config) {
    return { sent: false, mode: "none" };
  }

  const info = await config.transporter.sendMail({
    from: config.from,
    to,
    subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  if (config.mode === "smtp") {
    console.log(`Mail sent to inbox: ${to} (${subject})`);
  } else if (previewUrl) {
    console.log(`Mail preview: ${subject} → ${to}`);
    console.log(`Preview URL: ${previewUrl}`);
  }

  return {
    sent: true,
    mode: config.mode,
    previewUrl: previewUrl || undefined,
  };
}

async function sendVerificationEmail({ to, name, verificationUrl }) {
  const html = loadTemplate("verifyEmail.html", {
    name,
    verificationUrl,
    appName: "Auth API",
  });

  const result = await sendMail({
    to,
    subject: "Verify your email address",
    html,
  });

  if (!result.sent) {
    console.warn("Mail not configured. Verification URL:", verificationUrl);
    return { sent: false, verificationUrl };
  }

  return result;
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const html = loadTemplate("resetPassword.html", {
    name,
    resetUrl,
    appName: "Auth API",
  });

  const result = await sendMail({
    to,
    subject: "Reset your password",
    html,
  });

  if (!result.sent) {
    console.warn("Mail not configured. Reset URL:", resetUrl);
    return { sent: false, resetUrl };
  }

  return result;
}

module.exports = {
  initEmailTransport,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
