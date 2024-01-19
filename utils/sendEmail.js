import { createTransport } from 'nodemailer';

export const sendEmail = async ({ email, subject, message }) => {
    const transporter = createTransport ({
        // host:process.env.SMPT_HOST,
        // port: process.env.SMPT_PORT,
        service:  process.env.SMPT_SERVICE,
        auth:{
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_PASSWORD,
        }
    })

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject: subject,
        text: message,
    };

    try {
        await transporter.verify(); // Ensure the transporter is ready for sending emails
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Email send error:', error);
    }
};
