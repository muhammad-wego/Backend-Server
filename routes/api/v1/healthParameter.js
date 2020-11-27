const express = require("express");
const router = express.Router();
const healthParameter = require("../../../models/healthParameter");
const ObjectId = require("mongodb").ObjectId;
const AuthController = require("../../../contollers/AuthController");

router.post("/view/:id", AuthController.verify_token, function (req, res) {
  if (req.params.id == "all") {
    healthParameter
      .find()
      .then((params) => {
        return res.status(200).json({ params });
      })
      .catch((err) => {
        return res.status(500).json({ message: "Internal Server Error" });
      });
  } else {
    healthParameter
      .findById(req.params.id)
      .then((param) => {
        return res.status(200).json({ param });
      })
      .catch((err) => {
        return res.status(500).json({ message: "Internal Server Error" });
      });
  }
});

router.post("/add", AuthController.verify_token, function (req, res) {
  let newHealthParams = new healthParameter({
    name: req.body.paramName,
    lowerRange: req.body.lowerRange,
    upperRange: req.body.upperRange,
    normalPresence: req.body.normalPresence,
    stages: req.body.stages,
  });

  newHealthParams.save((err, result) => {
    if (err) return res.status(500).json({ message: "Internal Server Error" });
    return res.status(200).json({ message: "Health Parameter Added" });
  });
});

router.delete("/remove", AuthController.verify_token, function (req, res) {
  healthParameter.deleteOne(
    { _id: ObjectId(req.body.healthParamID) },
    (err, result) => {
      if (err)
        return res.status(500).json({ message: "Internal Server Error" });
      return res.status(200).json({ message: "Health Parameter Removed" });
    }
  );
});

module.exports = router;
