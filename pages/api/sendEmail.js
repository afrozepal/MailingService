import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { firstName, lastName, email, phoneNumber, referral, helpMessage } =
    req.body;

  if (!firstName || !lastName || !email) {
    return res
      .status(400)
      .json({ message: "Firstname, Lastname, and Email are mandatory" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.TAGS_EMAIL,
    to: "contact@tagsolutionsltd.com",
    subject: "New Lead From Website",
    text: `Lead details:
      First Name: ${firstName}
      Last Name: ${lastName}
      Email: ${email}
      Phone: ${phoneNumber ? phoneNumber : "Not provided"}
      How did you hear about us?: ${referral ? referral : "Not provided"}
      How can we help?: ${helpMessage ? helpMessage : "Not provided"}
    `,
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
