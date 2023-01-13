const express = require("express");
const db = require("./database");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./User");
const cors = require("cors");
const saltRounds = 5;
const SECRET_KEY = "thisisthesecretkey";

app.use(express.json());

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

db.authenticate()
  .then(() => console.log("db connected"))
  .catch((err) => console.log("error:" + err));

function isStringEmpty(s) {
  if (s === undefined || s.toString().length <= 0) {
    return true;
  } else {
    return false;
  }
}

function minMax(s, min, max) {
  if (s.toString().length < min) {
    return false;
  } else if (s.toString().length > max) {
    return false;
  } else {
    return true;
  }
}

function checkLength(s, type) {
  let min = 5;
  let max = 20;
  let msg = ` length must be in range( ${min} , ${max} )`;
  let check = minMax(s, min, max);
  if (check === false) {
    return [false, type + msg];
  } else {
    return [true];
  }
}

function checkFormat(s, type) {
  let regex_pattern = "";
  if (type === "email") {
    regex_pattern = /([a-zA-Z0-9\_\-\.]+)@([a-zA-Z]+).([a-zA-Z]+)/g;
  } else if (type === "name") {
    regex_pattern = /^([a-zA-Z]+)([\s]*([a-zA-Z]+))$/g;
  } else if (type === "phone") {
    regex_pattern = /^([0-9]+)$/g;
  }
  if (regex_pattern.test(s)) {
    return [true];
  } else {
    return [false, type + " Format Incorrect."];
  }
}

async function UserExists(uemail) {
  if (uemail === undefined) {
    return [false, "No email entered."];
  }
  let email_exists = await User.findOne({ where: { email: uemail } });
  if (email_exists !== null) {
    return [true, "Email exists."];
  } else {
    return [false, "Email does not exist."];
  }
}

async function getUsers() {
  let users;
  try {
    users = await User.findAll({ attributes: ["email", "phone", "name"] });
    return [true, users];
  } catch (error) {
    return [false, error];
  }
}

async function registerUser(uemail, upass, uphone, uname) {
  if (
    isStringEmpty(uemail) ||
    isStringEmpty(upass) ||
    isStringEmpty(uphone) ||
    isStringEmpty(uname)
  ) {
    return [0, "No field can be empty"];
  }

  let email_length = checkLength(uemail, "email");
  if (email_length[0] === false) {
    return email_length;
  }

  let pass_length = checkLength(upass, "password");
  if (pass_length[0] === false) {
    return pass_length;
  }

  let phone_length = checkLength(uphone, "phone");
  if (phone_length[0] === false) {
    return phone_length;
  }

  let name_length = checkLength(uname, "name");
  if (name_length[0] === false) {
    return name_length;
  }

  let email_format = checkFormat(uemail, "email");
  if (email_format[0] === false) {
    return email_format;
  }

  let name_format = checkFormat(uname, "name");
  if (name_format[0] === false) {
    return name_format;
  }

  let number_format = checkFormat(uphone, "phone");
  if (number_format[0] === false) {
    return number_format;
  }

  let email_exists = await UserExists(uemail);

  if (email_exists[0] === true) {
    return [false,"Email Already exists."];
  }

  uphone = parseInt(uphone);

  let hashed_pass = await bcrypt.hash(upass, saltRounds);
  const user = await User.create(
    {
      email: uemail,
      password: hashed_pass,
      phone: uphone,
      name: uname,
    },
    { fields: ["email", "password", "phone", "name"] }
  );
  return [true, user];
}

async function searchUser(uemail, upassword) {
  if (uemail === undefined) {
    return [false, "No email entered."];
  }

  if (upassword === undefined) {
    return [false, "No password entered."];
  }

  let email_exists = await UserExists(uemail);
  if (email_exists[0] === false) {
    return email_exists;
  }

  const curr_user = await User.findAll({
    attributes: ["password"],
    where: { email: uemail },
  });

  let hash = curr_user[0].dataValues["password"];
  let pass_check = await bcrypt.compare(upassword, hash);
  if (pass_check === true) {
    let users = await User.findAll({ attributes: ["email", "phone", "name"] });
    return [true, users];
  } else {
    return [false, "Password is incorrrect."];
  }
}

async function updateUser(uemail, uname) {
  if (uname === undefined) {
    return [false, "New Name invalid."];
  }

   let name_length = checkLength(uname, "name");
   if (name_length[0] === false) {
     return name_length;
   }
  
    let name_format = checkFormat(uname, "name");
    if (name_format[0] === false) {
      return name_format;
    }
  
  try {
    const updated = await User.update(
      { name: uname },
      { where: { email: uemail } }
    );
    console.log(updated[0])
    if (updated[0] > 0) {
      return [true, "Updated successfully."];
    } else {
      return [false, "No record updated"]
    }
  } catch (error) {
    return [false, "Error in updation."];
  }
}

const get_verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET_KEY, (err) => {
      if (err) {
        return res.status(403).json("Token verification failed.");
      } else {
        next();
      }
    });
  } else {
    res.status(401).json({ msg: "No token found in the header." });
  }
};

const verify_delete = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const email_to_delete = req.params.email;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET_KEY, (err, ver_token) => {
      if (err) {
        return res.status(403).json({ msg: "Token verification failed." });
      } else {
        let token_email = ver_token.email;
        console.log("email_to_delete:", email_to_delete);
        console.log("token_email:", token_email);
        if (email_to_delete !== token_email) {
          res.status(403).json({ msg: "You can only delete your own email" });
        } else {
          next();
        }
      }
    });
  } else {
    res.status(401).json({ msg: "No token found in the header." });
  }
};

//get all users
app.get("/api/users", get_verify, async (req, res) => {
  let user_table = await getUsers();
  if (user_table[0] === true) {
    res.json(user_table[1]);
  } else {
    res.status(500).json({ msg: "Error in getting users table." });
  }
});

//login
app.post("/api/users/login", async (req, res) => {
  let email_exists = await searchUser(req.body.email, req.body.password);
  if (email_exists[0] === false) {
    res.status(401).json({ msg: email_exists[1] });
  } else {
    const accessToken = jwt.sign({ email: req.body.email }, SECRET_KEY, {expiresIn:30});
    res.json({ accessToken });
  }
});

//register
app.post("/api/users/register", async (req, res) => {
  let register = await registerUser(
    req.body.email,
    req.body.password,
    req.body.phone,
    req.body.name
  );
  if (register[0] === true) {
    const accessToken = jwt.sign({ email: req.body.email }, SECRET_KEY, {expiresIn:60});
    res.json({ accessToken });
  } else {
    res.status(401).json({ msg: register[1] });
  }
});

//update
app.put("/api/users", async (req, res) => {

  let check_email = await UserExists(req.body.email);
  if (check_email[0] === false) {
    res.status(401).json({ msg: check_email[1] });
  } else {
    let updation = await updateUser(req.body.email, req.body.name);
    if (updation[0] === true) {
      res.json({ msg: updation[1] });
    } else {
      res.status(401).json({ msg: updation[1] });
    }
  }
});

async function deleteUser(email_to_del) {
  try {
    let del = await User.destroy({
      where: {
        email: email_to_del,
      },
    });
    if (del > 0) {
      {
        return [true, "Deletion Successful"];
      }
    } else {
      return [false, "No deletion."];
    }
  } catch (error) {
    return [false, "Error in deletion"];
  }
}
//delete
app.delete("/api/users/delete/:email", verify_delete, async (req, res) => {
  let deletion = await deleteUser(req.params.email);
  if (deletion[0] === false) {
    res.status(401).json({msg:deletion[1]})
  } else {
  res.json({ msg: deletion[1] });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`listening on port ${PORT}`));
// const PORT = process.env.PORT || 3000
