const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const md5 = require("md5");
const { pool } = require("./dbConfig");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "some data...";
const sendmail = require("./sendmail");
const nodemailer = require("nodemailer");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/signup", (req, res) => {
  res.render("signup");
});

app.get("/users/login", (req, res) => {
  res.render("login");
});

app.get("/users/dashboard", (req, res) => {
  res.render("dashboard", { user: "Temp" });
});

app.post("/users/signup", async (req, res) => {
  let { name, email, password, password1 } = req.body;
  console.log({ name, email, password, password1 });

  let hash = await bcrypt.hash(password, 10);
  let pas = md5(password);
  console.log(hash);
  pool.query(
    `INSERT INTO usersforMD5 (name,email,password_md5,password_bcrypt) VALUES ($1,$2,$3,$4)`,
    [name, email, pas, hash],
    (err, result) => {
      if (err) {
        throw err;
      } else {
        res.render("dashboard", { user: name });
      }
    }
  );
});

app.post("/users/login", async (req, res) => {
  let { email, password } = req.body;
  pool.query(
    `SELECT * FROM usersforMD5 WHERE email=$1`,
    [email],
    (err, result) => {
      if (err) {
        throw err;
      } else {
        if (md5(password) === result.rows[0].password_md5) {
          let name = result.rows[0].name;
          res.render("dashboard", { user: name });
        } else {
          res.send("Wrong Password");
        }

        // console.log(result.rows[0].name);
        console.log(result.rows[0]);
      }
    }
  );
});

app.get("/users/forgetpass", (req, res) => {
  res.render("forgetpass");
});

app.post("/users/forgetpass", async (req, res) => {
  const { email } = req.body;

  pool.query(
    `SELECT * FROM usersforMD5 WHERE email=$1`,
    [email],
    (err, result) => {
      if (err) {
        throw err;
      } else {
        const secret = JWT_SECRET + result.rows[0].password;

        // console.log(result.rows[0].name);
        console.log(result.rows[0].id);

        const payload = {
          email: email,
          id: result.rows[0].id,
        };
        const token = jwt.sign(payload, secret, { expiresIn: "15m" });
        const link = `http://localhost:3000/users/resetpass/${result.rows[0].id}/${token}`;
        console.log(link);

        const transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          auth: {
            user: "stephan.runolfsson39@ethereal.email",
            pass: "DwE5EPYA9zEwzUkmbP",
          },
        });

        const info = transporter.sendMail({
          from: '"Neel Dave" <test@example.com>', // sender address
          to: `${email}`, // list of receivers
          subject: "Password Reset ", // Subject line
          text: `Please Click on the link to Reset the Password
            ${link}
          `, // plain text body
          html: `Please Click on the link to Reset the Password
            ${link}
          `, // html body
        });
        // res.send("Password reset link send");
        res.send("Please Check your Mail");
      }
    }
  );
});

app.get("/sendmail", sendmail);

app.get("/users/resetpass/:id/:tokens", (req, res) => {
  const { id, tokens } = req.params;
  pool.query(`SELECT * FROM usersforMD5 WHERE id=$1`, [id], (err, result) => {
    if (err) {
      throw err;
    } else {
      const secret = JWT_SECRET + result.rows[0].password;
      try {
        const payload = jwt.verify(tokens, secret);
        res.render("resetpassword", { email: result.rows[0].email });
      } catch {}
    }
  });
});

app.post("/users/resetpass/:id/:token", (req, res) => {
  const { id, token } = req.params;
  const { password, password1 } = req.body;

  pool.query(`SELECT * FROM usersforMD5 WHERE id=$1`, [id], (err, result) => {
    if (err) {
      throw err;
    } else {
      const secret = JWT_SECRET + result.rows[0].password;
      if (password === password1) {
        result.rows[0].password = password;
        let pas = md5(password);
        pool.query(
          `UPDATE usersforMD5 SET password_md5 = $1 WHERE id = $2`,
          [pas, id],
          (err, result) => {
            if (err) {
              throw err;
            } else {
              res.send("Password Updated");
            }
          }
        );
      } else {
        res.send("Password and Conform Password are not same ");
      }
    }
  });
});

app.listen(3000, () => {
  console.log("Listering on post 3000");
});
