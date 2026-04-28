const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS,
    },
});

const sendBookingEmail = async (bookingDetails) => {
    const { name, email, eventTitle, date, time, brandName } = bookingDetails;

    const mailOptions = {
        from: `"${brandName}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Appointment Confirmed: ${eventTitle}`,
        html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
                <h2 style="color: #4f46e5;">Booking Confirmed!</h2>
                <p>Hi <strong>${name}</strong>,</p>
                <p>Your appointment for <strong>${eventTitle}</strong> with <strong>${brandName}</strong> has been successfully scheduled.</p>
                
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Date & Time</p>
                    <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">${date} at ${time}</p>
                </div>

                <p>If you need to make any changes, please contact us directly.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #9ca3af; text-align: center;">Powered by Quiz CRM SaaS</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent to:', email);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendBookingEmail };
