const nodemailer = require('nodemailer');
import { enviarMail } from '../config.private';

export interface MailOptions {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
}

export function sendMail(options: MailOptions) {
    return new Promise ((resolve, reject)=>{

        let transporter = nodemailer.createTransport({
            host: enviarMail.host,
            port: enviarMail.port,
            secure: enviarMail.secure,
            auth: enviarMail.auth,
        });
    
        let mailOptions = {
            from: options.from,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }) 
}
