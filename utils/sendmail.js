const emailTransporter = require('../config/email');
const sendEmail = async ({ to, subject, text }) => {
  const mailOption = {
    from: '"My App" <noreply@example.com>',
    to,
    subject,
    text,
  };
  await emailTransporter.sendMail(mailOption);
  console.log('✅ Email sent to:', to);
};
module.exports = sendEmail;
