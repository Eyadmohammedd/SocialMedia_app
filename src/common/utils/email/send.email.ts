import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer/index.js";
import { APPLICATION_NAME, EMAIL_APP, EMAIL_APP_PASSWORD } from "../../../config/config.js";

export const sendEmail = async ({
    to,
    cc,
    bcc,
    subject,
    html,
    attachments = []
}:Mail.Options) => {
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_APP,
    pass: EMAIL_APP_PASSWORD
  },
});

  const info = await transporter.sendMail({
    to,
    cc,
    bcc,
    subject,
    attachments,
    html,
    from: `"${APPLICATION_NAME}" <${EMAIL_APP}>'`,
  });

  console.log("Message sent:", info.messageId);
}