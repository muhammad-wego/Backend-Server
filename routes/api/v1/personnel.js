const express = require("express");
const router = express.Router();
const personnel = require("../../../models/personnel");
const company = require("../../../models/company");
const ObjectId = require("mongodb").ObjectId;
const AuthController = require("../../../contollers/AuthController");

router.post("/view/:id", AuthController.verify_token, function (req, res) {
  if (req.params.id == "all") {
    //if(req.decoded.priority == 1)
    personnel
      .find()
      .then((personnels) => {
        return res.status(200).json({ personnels });
      })
      .catch((err) => {
        return res.status(500).json({ message: "Internal Server Error" });
      });
    // return res.status(403).json({message:"Unauthorized"});
  } else
    personnel
      .findOne({ _id: req.params.id })
      .then((matchedPersonnel) => {
        return res.status(200).json({ personnel: matchedPersonnel });
      })
      .catch((err) => {
        return res.status(500).json({ message: "Internal Server Error" });
      });
});

router.post(
  "/add",
  AuthController.verify_token,
  AuthController.is_authorized,
  function (req, res) {
    if (req.decoded.priority == 3) req.body.companyID = req.decoded.company;
    company
      .findOne({ _id: ObjectId(req.body.companyID) })
      .then((matchedCompany) => {
        console.log();
        if (!matchedCompany)
          return res.status(403).json({ message: "Unauthorized" });
        else {
          let newPersonnel = new personnel({
            personnelName: req.body.personnelName,
            company: req.body.companyID,
            rank: req.body.rank,
            metalNo: req.body.metalNo,
            dateOfBirth: req.body.dateOfBirth,
          });

          newPersonnel.save((err, result) => {
            if (err)
              return res.status(500).json({ message: "Internal Server Error" });
            else {
              matchedCompany.personnel.push(result._id);
              matchedCompany.save((err, result) => {
                if (err)
                  return res
                    .status(500)
                    .json({ message: "Internal Server Error" });
                else
                  return res.status(200).json({ message: "Personnel Saved" });
              });
            }
          });
        }
      });
  }
);
router.post(
  "/update/:id",
  AuthController.verify_token,
  AuthController.is_authorized,
  function (req, res) {
    if (req.decoded.priority == 3) req.body.companyID = req.decoded.company;
    company
      .findOne({ _id: ObjectId(req.body.companyID) })
      .then(async (matchedCompany) => {
        console.log();
        if (!matchedCompany)
          return res.status(403).json({ message: "Unauthorized" });
        else {
          let updatePersonnel = await personnel.findById(req.params.id);
          updatePersonnel["personnelName"] = req.body.personnelName;
          updatePersonnel["rank"] = req.body.rank;
          updatePersonnel["metalNo"] = req.body.metalNo;
          updatePersonnel["dateOfBirth"] = req.body.dateOfBirth;
          updatePersonnel.save((err, result) => {
            if (err)
              return res.status(500).json({ message: "Internal Server Error" });
            else {
              matchedCompany.personnel.push(result._id);
              matchedCompany.save((err, result) => {
                if (err)
                  return res
                    .status(500)
                    .json({ message: "Internal Server Error" });
                else
                  return res.status(200).json({ message: "Personnel Saved" });
              });
            }
          });
        }
      });
  }
);

router.delete(
  "/remove",
  AuthController.verify_token,
  AuthController.is_authorized,
  function (req, res) {
    if (req.decoded.priority == 3) {
      personnel
        .findOne({ _id: ObjectId(req.body.personnelID) })
        .then((matchedPersonnel) => {
          console.log(matchedPersonnel.company == req.decoded.company);
          if (!matchedPersonnel)
            return res.status(403).json({ message: "Forbidded" });
          else {
            if (
              String(matchedPersonnel.company) === String(req.decoded.company)
            ) {
              personnel
                .deleteOne(
                  { _id: ObjectId(req.body.personnelID) },
                  (err, result) => {
                    if (err)
                      return res
                        .status(500)
                        .json({ message: "Internal Server Error" });
                    return res
                      .status(200)
                      .json({ message: "Personnel Deleted" });
                  }
                )
                .catch((err) => {
                  return res
                    .status(500)
                    .json({ message: "Internal Server Error" });
                });
            } else return res.status(403).json({ message: "Unauthorized" });
          }
        })
        .catch((err) => {
          return res.status(500).json({ message: "Internal Server Error" });
        });
    } else
      personnel
        .deleteOne({ _id: ObjectId(req.body.personnelID) }, (err, result) => {
          if (err)
            return res.status(500).json({ message: "Internal Server Error" });
          return res.status(200).json({ message: "Personnel Deleted" });
        })
        .catch((err) => {
          return res.status(500).json({ message: "Internal Server Error" });
        });
  }
);

module.exports = router;
