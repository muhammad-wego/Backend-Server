const express = require("express");
const router = express.Router();
const personnel = require("../../../models/personnel");
const company = require("../../../models/company");
const ObjectId = require("mongodb").ObjectId;
const AuthController = require("../../../contollers/AuthController");
const {  startSession } = require("mongoose");

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

router.post("/changeCompany", AuthController.verify_token,
AuthController.is_authorized,
async function (req, res){
  try{
    if(req.decoded.priority<3 || req.decoded.company==req.body.company){
      const Company = await company.findOne({_id:ObjectId(req.body.companyId)});
      if(!Company) return res.status(400).json({message:"Invalid Company Id"});
      const Personnel = await personnel.findOne({_id:ObjectId(req.body.personnelId)});
      const oldCompany = await company.findOne({_id:ObjectId(Personnel.company)});
      console.log(oldCompany);
      //remove from old company
      let oldCompanyPersonnels = oldCompany.personnel; 
      for(let i = 0;i < oldCompanyPersonnels.length;i++){
        if(oldCompanyPersonnels[i] == req.body.personnelId){
          oldCompanyPersonnels.splice(i,1);
        }
      }
      //add to new company
      console.log(Company);
      let newCompanyPersonnels = Company.personnel;
      newCompanyPersonnels.push(Personnel._id); 

      await personnel.updateOne({_id:ObjectId(req.body.personnelId)},{$set:{company:Company._id}});//Update Personnel
      await company.updateOne({_id:ObjectId(oldCompany._id)},{$set:{personnel:oldCompanyPersonnels}})//Update old company
      await company.updateOne({_id:ObjectId(req.body.companyId)},{$set:{personnel:newCompanyPersonnels}})//Update new Company

       const updatedPersonnel = await personnel.findOne({_id:req.body.personnelId});
       res.status(200).json({oldCompany:oldCompany._id,
        updatedCompany:updatedPersonnel.company});
    } 
    else{
      return res.status(401).json({message:"Unauthorized"});  
    }
  }catch(err){
    console.log(err);
    return res.status(500).json({message:"Internal Server Error"});  
  }
});

module.exports = router;
