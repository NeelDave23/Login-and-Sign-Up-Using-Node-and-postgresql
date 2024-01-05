const sendmail = async (req, res) => {
  let testaccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "stephan.runolfsson39@ethereal.email",
      pass: "DwE5EPYA9zEwzUkmbP",
    },
  });

  const info = await transporter.sendMail({
    from: '"Neel Dave" <test@example.com>', // sender address
    to: "bar@example.com, baz@example.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });

  res.send("Sending Mail");
};

module.exports = sendmail;
