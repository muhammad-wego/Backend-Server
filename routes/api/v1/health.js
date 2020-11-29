const express = require("express");
const router = express.Router();
const personnel = require("../../../models/personnel");
const personnelHealth = require("../../../models/personnelHealth");
const HealParam = require("../../../models/healthParameter");
const ObjectId = require("mongodb").ObjectId;

const AuthController = require("../../../contollers/AuthController");
const { body } = require("express-validator");

router.post(
  "/info/:id",
  AuthController.verify_token,
  AuthController.is_authorized,
  function (req, res) {
    personnel
      .findById(ObjectId(req.params.id))
      .then((entries) => {
        if (entries.allEntries.length < 1)
          return res.status(404).json({ message: "No Previous Entries Found" });

        let LatestEntry = entries.allEntries.pop();
        personnelHealth
          .findOne({ _id: ObjectId(LatestEntry) })
          .then(async (lastEntry) => {
            // var parameter = [];
            // for (const param in lastEntry.parameters) {
            //   await HealParam.findById(
            //     ObjectId(lastEntry.parameters[param]["healthParameter"])
            //   )
            //     .then((resp) => {
            //       parameter.push(resp);
            //     })
            //     .catch((err) => {
            //       return res
            //         .status(500)
            //         .json({ message: "No Parameter Found" });
            //     });
            // }

            return res.status(200).json({ lastEntry });
          })
          .catch((err) => {
            return res.status(500).json({ message: "Internal Server Error" });
          });
      })
      .catch((err) => {
        return res.status(500).json({ message: "Internal Server Error" });
      });
  }
);

router.post(
  "/view",
  AuthController.verify_token,
  AuthController.is_authorized,
  function (req, res) {
    let average = 0;

    const averagePromise = new Promise((resolve, reject) => {
      if (req.decoded.priority == 3) {
        personnel
          .find({ company: ObjectId(req.decoded.company) })
          .then((personnels) => {
            personnels.forEach((person, i) => {
              personnelHealth
                .findOne({
                  _id: ObjectId(
                    person.allEntries[person.allEntries.length - 1]
                  ),
                })
                .then((matchedRecord) => {
                  average += matchedRecord.score;
                  if (i == personnels.length - 1) resolve(average / i);
                })
                .catch((err) => {
                  reject();
                });
            });
          })
          .catch((err) => {
            return res.status(500).json({ message: "Internal Server Error" });
          });
      } else {
        personnel
          .find()
          .then((personnels) => {
            personnels.forEach((person, i) => {
              personnelHealth
                .findOne({
                  _id: ObjectId(
                    person.allEntries[person.allEntries.length - 1]
                  ),
                })
                .then((matchedRecord) => {
                  average += matchedRecord.score;
                  if (i == personnels.length - 1) resolve(average / i);
                })
                .catch((err) => {
                  reject(err);
                });
            });
          })
          .catch((err) => {
            return res.status(500).json({ message: "Internal Server Error" });
          });
      }
    });

    averagePromise
      .then((average) => res.status(200).json({ average }))
      .catch((err) => {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
      });
  }
);

router.post(
  "/add",
  AuthController.verify_token,
  AuthController.is_authorized,
  function (req, res) {
    console.log(req.body)
    if (!ObjectId.isValid(req.body.personnelID))
      return res.status(403).json({ message: "Invalid Personnel" });
    personnel
      .findOne({ _id: ObjectId(req.body.personnelID) })
      .then((matchedPersonnel) => {
        if (!matchedPersonnel)
          return res.status(403).json({ message: "Unauthorized Personnel" });
        else {
          if (
            req.decoded.priority < 3 ||
            String(req.decoded.company) == String(matchedPersonnel.company)
          ) {
            let newHealthRep = new personnelHealth({
              personnel: matchedPersonnel._id,
              parameters: [],
              dateOfEntry: new Date().getTime(),
              height : req.body.height,
              weight : req.body.weight,
              bmi : Number(req.body.weight)/(Number(req.body.height)*Number(req.body.height)),
              score: 10
            });
            req.body.parameters.forEach((param, i) => {
              if (!ObjectId.isValid(param.healthParameter))
                return res.status(403).json({ message: "Unauthorized Param" });
              let currentParam = {};
              currentParam.healthParameter = param.healthParameter;
              if (typeof param.stage != "undefined")
                currentParam.stage = param.stage;
              if (typeof param.value != "undefined")
                currentParam.value = param.value;
              if (typeof param.presence != "undefined")
                currentParam.presence = param.presence;
              newHealthRep.parameters.push(currentParam);
            });
            newHealthRep.save((err, result) => {
              if (err)
                return res
                  .status(500)
                  .json({ message: "Internal Server Error" });
              matchedPersonnel.allEntries.push(result._id);
              if (
                typeof req.body.followUpRequired != "undefined" &&
                typeof req.body.followUpRequired == "boolean"
              )
                matchedPersonnel.followUpRequired = req.body.followUpRequired;
              matchedPersonnel.save((err, _result) => {
                if (err)
                  return res
                    .status(500)
                    .json({ message: "Internal Server Error" });
                return res
                  .status(200)
                  .json({ message: "Health Record Created" });
              });
            });
          } else
            return res.status(403).json({ message: "Unauthorized Company" });
        }
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error" });
      });
  }
);

module.exports = router;
