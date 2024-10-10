import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import admin from "../../lib/firebaseAdmin";
import { isValidNumber } from "libphonenumber-js";

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string; 
    howDidYouHear?: string; 
    howCanWeHelp?: string; 
}

const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;

const checkNames = (name: string) => {
    const stripped = name.trim();
    if (/\d/.test(stripped)) {
      return false;
    }
    return stripped;
  };

const validateForm = (body: FormData) => {
  const { firstName, lastName, email, phone, howDidYouHear, howCanWeHelp } = body;
    // required 
  if (!firstName || !lastName || !email) {
    return { valid: false, message: "First Name, Last Name, and Email are required." };
  }

    //email format
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Invalid email format." };
  }
  // first name last name should not have digits 
  const strippedFirstName= checkNames(firstName);
  const strippedLastName = checkNames(lastName);

  if (!strippedFirstName || !strippedLastName) {
    return { valid: false, message: 'Names cannot contain digits' };
  }
  ////// for phone number 
  if (phone && !isValidNumber(phone)) {
    return { valid: false, message: 'Invalid phone number' };
    }


  return {
    valid: true,
    firstName,
    lastName,
    email,
    phone: phone || "",
    howDidYouHear: howDidYouHear || "",
    howCanWeHelp: howCanWeHelp || "",
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(500).json({ error: "Method not allowed" });
  }

  const validation = validateForm(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "contact@tagsolutionltd.com",
      subject: "New Lead From Website",
      text: `You have a new lead:
        First Name: ${validation.firstName}
        Last Name: ${validation.lastName}
        Email: ${validation.email}
        Phone: ${validation.phone}
        How Did You Hear About Us?: ${validation.howDidYouHear}
        How Can We Help?: ${validation.howCanWeHelp}`,
    };

    await transporter.sendMail(mailOptions);

    const db = admin.firestore();
    await db.collection("emails").add({
      ...validation,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: "Form submitted successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
}
