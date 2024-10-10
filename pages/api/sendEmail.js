import nodemailer from "nodemailer";
import { isValidNumber } from "libphonenumber-js";

const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;

const checkNames = (name) => {
    const stripped = name.trim();
    if (/\d/.test(stripped)) {
        return false;
    }
    return stripped;
};

const validateForm = (body) => {
    const { firstName, lastName, email, phone, howDidYouHear, howCanWeHelp } = body;

    // Required fields
    if (!firstName || !lastName || !email) {
        return { valid: false, message: "First Name, Last Name, and Email are required." };
    }

    // Email format
    if (!emailRegex.test(email)) {
        return { valid: false, message: "Invalid email format." };
    }

    // Names should not contain digits
    const strippedFirstName = checkNames(firstName);
    const strippedLastName = checkNames(lastName);

    if (!strippedFirstName || !strippedLastName) {
        return { valid: false, message: 'Names cannot contain digits' };
    }

    // Phone number validation
    if (phone && !isValidNumber(phone)) {
        return { valid: false, message: 'Invalid phone number' };
    }

    return {
        valid: true,
        firstName: strippedFirstName,
        lastName: strippedLastName,
        email,
        phone: phone || "",
        howDidYouHear: howDidYouHear || "",
        howCanWeHelp: howCanWeHelp || "",
    };
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const validation = validateForm(req.body);
    if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: "contact@tagsolutionsltd.com",
        subject: "New Lead From Website",
        text: `Lead details:
          First Name: ${validation.firstName}
          Last Name: ${validation.lastName}
          Email: ${validation.email}
          Phone: ${validation.phone}
          How did you hear about us?: ${validation.howDidYouHear}
          How can we help?: ${validation.howCanWeHelp}`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
        return res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email", error });
    }
}
