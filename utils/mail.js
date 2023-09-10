const mailer = require("nodemailer");

const sendMail = (resetLink, cb) => {
  let transporter = mailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.APP_EMAIL_USER,
      pass: process.env.APP_EMAIL_PASSWD,
    },
  });

  let mailOptions = {
    from: process.env.APP_EMAIL_USER,
    to: "smagesh2106@gmail.com",
    subject: "Node password reset link",
    text: resetLink,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      cb(error);
    } else {
      cb(null);
    }
  });
};

module.exports = {
  sendMail,
};
