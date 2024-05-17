const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const nodemailer = require("nodemailer");

const db = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.DATABASE_USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});


var userId = 0;

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.userSave) {
    try {
      // 1. Verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.userSave,
        process.env.JWT_SECRET
      );
      console.log(decoded);
      db.query(
        "SELECT * FROM register WHERE id = ?",
        [decoded.id],
        (err, results) => {
          console.log(results);
          if (!results) {
            return next();
          }
          req.user = results[0];
          return next();
        }
      );
    } catch (err) {
      console.log(err);
      return next();
    }
  } else {
    next();
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.render("login.ejs", { warning: "Please Provide an email and password" });
    } else {
      db.query(
        "SELECT * FROM register WHERE email = ?",
        [email],
        async (err, results) => {
          console.log(results);
          if (
            !results ||
            !(await bcrypt.compare(password, results[0].password))
          ) {
            res.render("login.ejs", { warning: "Email or Password is incorrect" });
          } else {
            const id = results[0].id;

            const token = jwt.sign({ id }, process.env.JWT_SECRET, {
              expiresIn: process.env.JWT_EXPIRES_IN,
            });

            console.log("the token is " + token);

            const cookieOptions = {
              expires: new Date(
                Date.now() +
                  process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
              ),
              httpOnly: true,
            };

            // Assuming you have a table named "conductors" with a field named "name"
            db.query(
              "SELECT name FROM register WHERE id = ?",
              [id],
              (err, conductorResult) => {
                if (err) {
                  console.log(err);
                  res.status(500).send("Internal Server Error");
                } else {
                  const conductorName = conductorResult[0].name;
                  res.cookie("userSave", token, cookieOptions);
                  res.status(200).render("conductor.ejs", { name: conductorName });
                }
              }
            );
          }
        }
      );
    }
  } catch (err) {
    console.log(err);
  }
};

// OTP ////////////////////////////

function generateOTP() {
  // Generate a random number between 1000 and 9999 (inclusive)
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;
  return randomNumber;
}

async function sendOtp(otp,email){
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
     user: "electeasevote@gmail.com",
     pass: "gnwmaphruoxldyat"
  }
});
const mailOptions = {
  from: "electeasevote@gmail.com",
  to: email,
  subject: "Online Voting Platform",
  html: ` YOUR OTP IS  ${otp}`
};
  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP sent successfully');
  } catch (error) {
    console.error('Error sending OTP:', error);
}}

exports.register = async(req, res) => {
  console.log(req.body);
  const { Name, Email, phno, Password, confirmPassword } = req.body;
  try {
    // Generate OTP
    const otp = generateOTP();

    req.session.user = { Name, Email, phno, Password };
    
    // Send OTP to user's email
    await sendOtp(otp, Email);

    // Store OTP in session
    req.session.otp = otp;

    // Redirect to OTP verification page
    res.redirect('/otp'); // Assuming '/otp' is the route for OTP verification page
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    // Extract OTP digits from req.body
    const { digit1, digit2, digit3, digit4 } = req.body;

    // Concatenate OTP digits to form the complete OTP
    const OTP = parseInt(digit1.toString() + digit2.toString() + digit3.toString() + digit4.toString(), 10);

    // Verify OTP
    if (req.session.otp && req.session.otp === OTP) {
      // OTP verified, proceed with registration
      const { Name, Email, phno, Password } = req.session.user; // Assuming you stored user details in session during initial registration request

      // Hash password
      const hashedPassword = await bcrypt.hash(Password, 8);

      // Insert user into database
      await db.query(
        "INSERT INTO register SET ?",
        { name: Name, email: Email, phno: phno, Password: hashedPassword }
      );

      // Clear OTP from session
      delete req.session.otp;

      // Redirect to success page or send response
      res.status(200).send('User registered successfully');
    } else {
      // Invalid OTP
      res.status(400).send('Invalid OTP');
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).send('Internal Server Error');
  }
};


///////////////////////////////////////////////////////////////////////////////////////



exports.logout = (req, res) => {
  res.cookie("userSave", "logout", {
    expires: new Date(Date.now() - 1000), // set expiry to past time
    httpOnly: true,
  });
  res.status(200).redirect("/");
};

// Update Details

exports.update = (req, res) => {
  const { Email, old, newPass } = req.body;
  try {
    // Check if the user exists
    db.query(
      "SELECT * FROM register WHERE email = ?",
      [Email],
      async (err, results) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Internal Server Error");
        }
        if (results.length === 0) {
          return res.status(404).send("User not found");
        }

        // Check if the provided password matches the stored password
        const isPasswordMatch = await bcrypt.compare(old, results[0].password);
        if (!isPasswordMatch) {
          res.render('update-details.ejs', { warning: "Incorrect password" });
        } else {
          // Hash the new password
          const hashedNewPassword = await bcrypt.hash(newPass, 8);

          // Update the user's password
          db.query(
            "UPDATE register SET password = ? WHERE email = ?",
            [hashedNewPassword, Email],
            (err, updateResults) => {
              if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
              }
              res.render('login.ejs', { warning: "Password updated successfully" });
            }
          );
        }
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
}

var userId = 0;
exports.userdata = (req, res) => {
const token = req.cookies.userSave; // Get the JWT token from the cookie

  if (!token) {
    return res.status(400).send("Invalid request format");
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id; // Get the user ID from the decoded token

    const { phone_number } = req.body;

    // Insert phone number along with the user ID into the database
    const sql =
      "INSERT INTO register_phone_numbers (user_id, phone_number) VALUES (?, ?)";
    db.query(sql, [userId, phone_number], (err, result) => {
      if (err) {
        console.error("Error executing query:", err);
        return res.status(500).send("Failed to insert phone number into the database");
      }

      // Query the database to get the conductor name using the user ID
      db.query("SELECT name FROM register WHERE id = ?", [userId], (err, result) => {
        if (err) {
          console.error("Error executing query:", err);
          return res.status(500).send("Internal Server Error");
        }

        if (result.length === 0) {
          return res.status(404).send("Conductor not found");
        }

        const conductorName = result[0].name; // Get the conductor name from the query result

        // Render the response with the conductor name
        res.render('conductor.ejs', { warning: "Phone Number Inserted Successfully", name: conductorName });
      });
    });
  } catch (err) {
    console.error("Error verifying token:", err);
    return res.status(401).send("Invalid token");
  }
};

let electId = null; // Initialize electionId
const crypto = require("crypto");

exports.conductElection = (req, res) => {
  const { election_name, candidate } = req.body;
  const token = req.cookies.userSave;

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  userId = decoded.id; // Get the user ID from the decoded token

  db.query("INSERT INTO elections (name,conductor_id) VALUES (?,?)", [election_name, userId], (err, result) => {
    if (err) {
      console.error("Error inserting election name into the database:", err);
      return res.status(500).json({ success: false, message: "Failed to conduct election" });
    }

    const electionId = result.insertId; // Update electionId after insertion
    electId = electionId;

    const candidateValues = candidate.map(name => [name, electionId]);
    db.query("INSERT INTO candidates (name, election_id) VALUES ?", [candidateValues], (err, result) => {
      if (err) {
        console.error("Error inserting candidates into the database:", err);
        return res.status(500).json({ success: false, message: "Failed to conduct election" });
      }

      // Fetch conductor name
      db.query("SELECT name FROM register WHERE id = ?", [userId], (err, result) => {
        if (err) {
          console.error("Error fetching conductor name:", err);
          return res.status(500).json({ success: false, message: "Failed to conduct election" });
        }

        if (result.length === 0) {
          return res.status(404).send("Conductor not found");
        }
        
        const conductorName = result[0].name; // Get the conductor name from the query result

        // Render the response with the conductor name
        res.render('conductor.ejs', { warning: "Election conducted successfully", name: conductorName });
      });
    });
  });
};


function generateShortToken() {
  // Generate a random 6-character token
  return crypto.randomBytes(3).toString('hex');
}

exports.getVotingLink = (req, res) => {
  const eId = electId;
  if (electId === null) {
    return res.status(404).send("No election conducted yet");
  }

  // Store election ID in the session
  req.session.electionId = eId;

  const generatedToken = generateShortToken();
  const baseUrl = 'http://localhost:8000/voter-login';
  const votingLink = `${baseUrl}/${generatedToken}/${eId}`;

  console.log(votingLink);
  res.status(200).send(votingLink);
};

exports.authenticateAndRenderVoterPage = (req, res, next) => {
  const { Name, Email, phno } = req.body;
  const electionId = req.session.electionId;

  // Authentication check
  if (!Name || !Email || !phno || !electionId) {
    return res.status(400).send("Please provide name, email, phone number, and ensure election ID is available in session.");
  }

  // Check authorization
  db.query("SELECT conductor_id FROM elections WHERE id = ?", [electionId], (err, electionResult) => {
    if (err) {
      console.error("Error fetching conductor ID from database:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (electionResult.length === 0) {
      return res.status(404).send("Election not found");
    }

    const conductorId = electionResult[0].conductor_id;

    db.query("SELECT phone_number FROM register_phone_numbers WHERE user_id = ?", [conductorId], (err, conductorResults) => {
      if (err) {
        console.error("Error fetching conductor phone numbers from database:", err);
        return res.status(500).send("Internal Server Error");
      }

      const conductorPhoneNumbers = conductorResults.map(conductor => conductor.phone_number);

      if (!conductorPhoneNumbers.includes(phno)) {
        return res.status(403).send("Unauthorized phone number.");
      }

      // If authenticated and authorized, insert details into the voters table
      const voterDetails = {
        name: Name,
        email: Email,
        phone_number: phno,
        election_id: electionId
      };

      db.query("INSERT INTO voters SET ?", voterDetails, (err, insertResult) => {
        if (err) {
          console.error("Error inserting voter details into the database:", err);
          return res.status(500).send("Internal Server Error");
        }

        // If insertion successful, retrieve candidate names and render the voter page
        db.query("SELECT name FROM candidates WHERE election_id = ?", [electionId], (err, candidateResults) => {
          if (err) {
            console.error("Error retrieving candidates:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch candidates" });
          }

          const candidates = candidateResults.map(candidate => candidate.name);

          // Render the voter page with the retrieved candidate names
          res.render('voter', { candidates: candidates });
        });
      });
    });
  });
};


exports.castVote = (req, res) => {
  const { candidate } = req.body;
  const electionId = req.session.electionId;

  // Check if the user has already voted in this session
  if (req.session.hasVoted) {
    return res.status(400).json({ success: false, message: "You have already voted in this session" });
  }

  if (!electionId) {
    return res.status(400).json({ success: false, message: "Election ID not found in session" });
  }

  db.query("SELECT id FROM candidates WHERE name = ? AND election_id = ?", [candidate, electionId], (err, candidateResult) => {
    if (err) {
      console.error("Error retrieving candidate ID:", err);
      return res.status(500).json({ success: false, message: "Failed to submit vote" });
    }

    if (candidateResult.length === 0) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    const candidateId = candidateResult[0].id;
    db.query("UPDATE candidates SET votes = votes + 1 WHERE id = ? AND election_id = ?", [candidateId, electionId], (err, result) => {
      if (err) {
        console.error("Error updating vote count:", err);
        return res.status(500).json({ success: false, message: "Failed to submit vote" });
      }
      
      // Mark the user as having voted in this session
      req.session.hasVoted = true;

      return res.status(200).json({ success: true, message: "Vote submitted successfully" });
    });
  });
};
