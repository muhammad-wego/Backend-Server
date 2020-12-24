const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const jwt_secret = process.env["JWT_SECRET"];
const ObjectId = require("mongodb").ObjectId;
const admin = require("../models/admin");
const personnel = require("../models/personnel");

exports._sign_in_checks = [
  check("username").exists(),
  check("password").isLength({ min: 6 }).exists(),
];

exports._register_checks = [
  check("username").not().isEmpty,
  check("password").isLength({ min: 6 }),
  check("personnelID").not().isEmpty,
];

exports.verify_token = function (req, res, next) {
  let token = req.body.token;
  if (token) {
    token = /^(Bearer\x\S*)$/.test(token) ? token.split(" ")[1] : token;

    jwt.verify(token, jwt_secret, function (err, decoded) {
      if (err)
        return res.status(500).json({ message: "Internal Server Error" });

      if (decoded.username) {
        req.decoded = decoded;
        next();
      } else return res.status(401).json({ message: "Authentication Failed" });
    });
  } else return res.status(401).json({ message: "Authentication Failed" });
};

exports.is_authorized = function (req, res, next) {
  admin
    .findOne({ username: req.decoded.username })
    .then((matchedAdmin) => {
      if (!matchedAdmin) res.status(401).json({ message: "Unauthorized" });
      else {
        req.decoded["priority"] = matchedAdmin.priority;
        if (matchedAdmin.priority > 1){
          req.decoded["company"] = matchedAdmin.company;
          next();
        }
        else next();
      }
    })
    .catch((err) => {
      return res.status(500).json({ message: "Internal Server Error" });
    });
};
