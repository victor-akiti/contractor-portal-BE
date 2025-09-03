// sendMail.js (replacement for your SendGrid-based one)
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    requireTLS: true
});

const sender = 'amninotifications@amni.com';

const sendMail = (data) => {
    return new Promise((resolve, reject) => {
        // Map SendGrid style object to Nodemailer style
        const mailOptions = {
            from: sender || null,
            replyTo: 'no-reply@amni.com',
            to: data.to || null,
            cc: data.cc || null,
            bcc: data.bcc || null,
            subject: data.subject || null,
            text: data.text || null,
            html: data.html || null
        };

        // Handle sendAt manually
        if (data.sendAt && data.sendAt > Math.floor(Date.now() / 1000)) {
            const delay = (data.sendAt * 1000) - Date.now();
            return setTimeout(() => {
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) return reject(err);
                    resolve({ statusCode: 202, info }); // mimic SendGrid success
                });
            }, delay);
        }

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) return reject(err);
            // Mimic SendGrid's "accepted" response
            resolve({ statusCode: 202, info });
        });
    });
};

module.exports = { sendMail };
