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

router.post("/update/:id",AuthController.verify_token,function(req,res){
  if(req.decoded.priority > 1) return res.status(403).json({message : "Unauthorized"});
  if(!ObjectId.isValid(req.params.id)) return res.status(403).json({message : "Invalid Health Parameter ID"});
  healthParameter.findOne({_id:req.params.id}).then(matchedParam => {
    if(!matchedParam) return res.status(403).json({ message : "Unauthorized" });
    else {
      if (typeof req.body.paramName != 'undefined') matchedParam.name = req.body.paramName;
      if (typeof req.body.lowerRange != 'undefined') matchedParam.lowerRange = req.body.lowerRange;
      if (typeof req.body.upperRange != 'undefined') matchedParam.upperRange = req.body.upperRange;
      if (typeof req.body.stages != 'undefined') matchedParam.stages = req.body.stages;

      matchedParam.save((err,result) => {
        if(err) return res.status(500).json({message : "Internal Server Error"});
        return res.status(200).json({ message : "Health Parameter Updated"});
      });
    }
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
