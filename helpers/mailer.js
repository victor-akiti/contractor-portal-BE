
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const sender = 'no-reply@amni.com';

const sendMail = (data) => {
    console.log({data});
    let now = Math.ceil((Date.now() / 1000)) + 10;
    try {
        const msg = {
            to: data.to || null,
            bcc: data.bcc || null,
            cc: data.cc || null,
            from: sender || null,
            subject: data.subject || null,
            text: data.text || null,
            html: data.html || null,
            sendAt: data.sendAt || now,
        };
        return sgMail.send(msg);
    } catch (error) {
        console.log({error});
    }
};
 module.exports = {
    sendMail
 }