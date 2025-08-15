// sendMail.js (replacement for your SendGrid-based one)
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


console.log({transporter});

const sender = 'amninotifications@amni.com';

const sendMail = (data) => {
    return new Promise((resolve, reject) => {
        // Map SendGrid style object to Nodemailer style
        const mailOptions = {
            from: sender || null,
            to: data.to || null,
            cc: data.cc || null,
            bcc: data.bcc || null,
            subject: data.subject || null,
            text: data.text || null,
            html: data.html || null
        };

        console.log('Sending email with options:', mailOptions);

        // Handle sendAt manually
        if (data.sendAt && data.sendAt > Math.floor(Date.now() / 1000)) {
            const delay = (data.sendAt * 1000) - Date.now();
            console.log(`Delaying email send by ${delay} ms`);
            return setTimeout(() => {
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) return reject(err);
                    resolve({ statusCode: 202, info }); // mimic SendGrid success
                });
                console.log(`Email sent after delay of ${delay} ms`);
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
