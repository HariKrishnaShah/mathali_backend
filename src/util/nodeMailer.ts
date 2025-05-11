const nodemailer = require("nodemailer");
import { error } from "console";
import dotenv from "dotenv";
import path from "path";
dotenv.config();
import ejs from "ejs";
import { format } from "date-fns";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use SSL
  auth: {
    user: process.env.MAIL_ADDRESS,
    pass: process.env.MAIL_PASSWORD,
  },
});

export const sendCredentialMail = async (
  receiverMail: string,
  firstName: string,
  password: string,
  validTillDate: Date
) => {
  try {
    const validity = format(validTillDate, "do MMM yyyy");
    const templatePath = path.join(
      __dirname,
      "..",
      "media",
      "mailTemplate.ejs"
    );
    // Render the template with data
    const htmlContent = await ejs.renderFile(templatePath, {
      firstName,
      receiverMail,
      password,
      validity,
    });

    const mailOptions = {
      from: process.env.MAIL_ADDRESS,
      to: receiverMail,
      subject: "Login Credentials of Palika GIS Demo",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions, (error: any, info: any) => {
      if (error) {
        console.log("Error sending email");
      }
      console.log("Email sent successfully");
    });
  } catch (error) {
    console.log(error);
  }
};

export const sendConfirmationMail = async (
  receiverMail: string,
  firstName: string
) => {
  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "media",
      "confirmationTemplate.ejs"
    );
    // Render the template with data
    const htmlContent = await ejs.renderFile(templatePath, {
      firstName,
      receiverMail,
    });

    const mailOptions = {
      from: process.env.MAIL_ADDRESS,
      to: receiverMail,
      subject: "Confirmation of Demo Request Received.",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions, (error: any, info: any) => {
      if (error) {
        console.log("Error sending email");
      }
      console.log("Email sent successfully");
    });
  } catch (error) {
    console.log(error);
  }
};

export const sendConsultationConfirmationMail = async (
  receiverMail: string,
  firstName: string
) => {
  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "media",
      "consultationConfirmation.ejs"
    );
    // Render the template with data
    const htmlContent = await ejs.renderFile(templatePath, {
      firstName,
      receiverMail,
    });

    const mailOptions = {
      from: process.env.MAIL_ADDRESS,
      to: receiverMail,
      subject: "Confirmation of Consultation Request Received.",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions, (error: any, info: any) => {
      if (error) {
        console.log("Error sending email");
      }
      console.log("Email sent successfully");
    });
  } catch (error) {
    console.log(error);
  }
};
