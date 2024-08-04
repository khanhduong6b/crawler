require('dotenv').config({ path: __dirname + '/.env_yteco' });
const { Department } = require('../../model/user')
const nodemailer = require("nodemailer");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const DEFAULT_OUT_EMAIL = {
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secureConnection: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
}
/**@class MailUtil*/
function MailUtil() {
    const SELF = {
        countTestMail: 0,
        sendEmail: (subject, content, to = 'anh.nt@tcsc.vn', cc = '', bcc = '', from = '') => {
            const mailData = {
                from: DEFAULT_OUT_EMAIL.auth.user,
                subject: subject,
                html: content,
                to: to,
                //to: 'anh.nt@tcsc.vn',
                //cc: 'it@tcsc.vn'
            }
            if (cc)
                mailData.cc = cc;
            if (bcc)
                mailData.bcc = bcc
            let transporter = nodemailer.createTransport(DEFAULT_OUT_EMAIL)
            return new Promise((resolve, reject) => {
                transporter.sendMail(mailData, function (err, info) {
                    if (err) return reject(err);
                    return resolve()
                });
            })
        }
    };
    return {
        /**@memberOf MailUtil*/
        testSendEmail: (subject, content) => {
            return SELF.sendEmail(subject, content)
        },
        sendEmailWithAttachment: (subject, content, to, cc, bcc, attachments) => {
            console.log('sendEmailWithAttachment', subject, content.substring(0, 100), to, cc, bcc, attachments);
            return new Promise((resolve, reject) => {
                let transporter = nodemailer.createTransport(DEFAULT_OUT_EMAIL)
                transporter.verify(error => {
                    if (!error) {
                        console.log('Verify email success, going to send email')
                        const mailData = {
                            from: DEFAULT_OUT_EMAIL.auth.user,
                            subject: subject,
                            html: content,
                            to: to,
                            attachments: attachments
                        }
                        if (cc) {
                            mailData.cc = cc
                        }

                        if (bcc) {
                            mailData.bcc = bcc
                        }

                        transporter.sendMail(mailData, function (err, info) {
                            if (err) return reject(err);
                            return resolve()
                        })
                    } else {
                        console.log('Verify email failed', error)
                        reject(error)
                    }
                })
            })
        },
        checkLogin: (user, pass) => {
            console.log(`login with: ${user}`);
            const config = {
                host: 'mail.tcsc.vn',
                port: 25,
                secure: false, // use SSL
                auth: {
                    user: user,
                    pass: pass
                },
                tls: {
                    ciphers: 'SSLv3',
                    rejectUnauthorized: false,
                }
            }
            const transporter = nodemailer.createTransport(config);
            return new Promise((resolve, reject) => {
                transporter.verify(function (error, success) {
                    if (error) {
                        return reject(error)
                    } else {
                        return resolve()
                    }
                })
            })
        },
        sendEmail: (subject, content, to, cc, from) => {
            return new Promise((resolve, reject) => {
                let transporter = nodemailer.createTransport(DEFAULT_OUT_EMAIL)
                transporter.verify(error => {
                    if (!error) {
                        console.log('Verify email success, going to send email')
                        return SELF.sendEmail(subject, content, to, cc, from)
                            .then(() => {
                                resolve()
                            })
                            .catch(error => {
                                reject(error)
                            })
                    } else {
                        console.log('Verify email failed', error)
                        reject(error)
                    }
                })
            })
        },
        sendEmailBy: async (subject, content, to, from = '', password, senderName = '', ccEmail = '') => {
            console.log('sendEmailBy', ++SELF.countTestMail, subject, content.substring(0, 100), to, from)
            // to = 'ittest@tcsc.vn'
            const idxCheck = from.indexOf('@info.tcsc.vn')
            let transporter = nodemailer.createTransport({
                host: idxCheck > -1 ? 'mail.tcsc.vn' : 'smtp.office365.com',
                port: idxCheck > -1 ? 25 : 587,
                secure: false, // use SSL
                auth: {
                    user: from,
                    pass: password
                },
                tls: {
                    ciphers: 'SSLv3',
                    rejectUnauthorized: false
                }
            })
            const mailName = await Department.findOne({ username: from })?.mailName || `TCSC-${senderName}`
            const mailData = {
                from: `${mailName}<${from}>`,
                subject: subject,
                html: content,
                to: to,
                cc: ccEmail
            }
            return new Promise((resolve, reject) => {
                transporter.sendMail(mailData, function (err, info) {
                    if (err) {
                        console.log('send email error', err)
                        return reject(err);
                    }
                    return resolve()
                });
            })
        },
        validateEmail: (email) => {
            const pattern = /^[\w\.-]+@([\w-]+\.)+[\w-]+$/;
            return pattern.test(email)
        }
    }
}
module.exports = new MailUtil();

