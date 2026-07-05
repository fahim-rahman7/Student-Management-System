require("dotenv").config();
const { initEmailTransport, sendVerificationEmail } = require("../helpers/emailHelper");

async function main() {
  const to = process.argv[2] || process.env.SMTP_USER;

  if (!to) {
    console.error("Usage: node scripts/testMail.js you@example.com");
    process.exit(1);
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("Set SMTP_USER and SMTP_PASS in .env first.");
    process.exit(1);
  }

  await initEmailTransport();

  const result = await sendVerificationEmail({
    to,
    name: "Test User",
    verificationUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=test-token`,
  });

  if (result.sent) {
    console.log(`\nSuccess! Check the inbox for: ${to}`);
    if (result.previewUrl) {
      console.log(`Preview: ${result.previewUrl}`);
    }
  } else {
    console.error("Failed to send test email.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
