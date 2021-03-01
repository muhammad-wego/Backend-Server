const express = require("express");
const router = express.Router();
const personnel = require("../../../models/personnel");
const company = require("../../../models/company");
const ObjectId = require("mongodb").ObjectId;
const AuthController = require("../../../contollers/AuthController");
const {  startSession } = require("mongoose");
const admin = require("../../../models/admin");
const battalion = require("../../../models/battalion");
const personnelHealth = require("../../../models/personnelHealth");

router.post(
  "/view/:id",
  AuthController.verify_token,
  AuthController.is_authorized,
 function (req, res) {
    if (req.params.id == "all") {
      if (req.decoded.priority == 1) {
        personnel
          .find()
          .then(async(Personnels) => {
            var personnels = []
            console.log(Personnels)
            for(let person of Personnels)
            {
              const comp = await company.find({_id:ObjectId(person.company)});
              const batt = await battalion.find({_id:ObjectId(person.battalion)});
              let personl = {
                _id:person._id,
                personnelName: person.personnelName,
                companyName: comp.length>0? comp[0].companyName:"",
                battalionNumber: batt.length>0?batt[0].battalionNumber:"",
                company:person.company,
                battalion:person.battalion,
                rank:person.rank,
                metalNo: person.metalNo,
                lastEntry:person.lastEntry,
                dateOfBirth: person.dateOfBirth,
              }
              personnels.push(personl);
            }

            return res.status(200).json({ personnels });
          })
          .catch((err) => {
            console.log(err)
            return res.status(500).json({ message: "Internal Server Error" });
          });
      } 
      else if (req.decoded.priority == 2) {
        personnel
          .find({battalion:req.decoded.battalion})
          .then(async(Personnels) => {
            var personnels = []
            console.log(Personnels)
            for(let person of Personnels)
            {
              const comp = await company.find({_id:ObjectId(person.company)});
              const batt = await battalion.find({_id:ObjectId(person.battalion)});
              let personl = {
                _id:person._id,
                personnelName: person.personnelName,
                companyName: comp.length>0? comp[0].companyName:"",
                battalionNumber: batt.length>0?batt[0].battalionNumber:"",
                company:person.company,
                battalion:person.battalion,
                rank:person.rank,
                metalNo: person.metalNo,
                lastEntry:person.lastEntry,
                dateOfBirth: person.dateOfBirth,
              }
              personnels.push(personl);
            }
            return res.status(200).json({ personnels });
          })
          .catch((err) => {
            console.log(err)
            return res.status(500).json({ message : "Internal Server Error"});
          });
      }
      else {
        personnel
          .find({ company: req.decoded.company })
          .then(async (Personnels) => {
            var personnels = []
            console.log(Personnels)
            for(let person of Personnels)
            {
              const comp = await company.find({_id:ObjectId(person.company)});
              const batt = await battalion.find({_id:ObjectId(person.battalion)});
              let personl = {
                _id:person._id,
                personnelName: person.personnelName,
                companyName: comp.length>0? comp[0].companyName:"",
                battalionNumber: batt.length>0?batt[0].battalionNumber:"",
                company:person.company,
                battalion:person.battalion,
                rank:person.rank,
                lastEntry:person.lastEntry,
                metalNo: person.metalNo,
                dateOfBirth: person.dateOfBirth,
              }
              personnels.push(personl);
            }
            return res.status(200).json({ personnels });
          })
          .catch((err) => {
            return res.status(500).json({ message: "Internal Server Error" });
          });
      }
      //if(req.decoded.priority == 1)

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
  }
);

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
          if(typeof req.body.metalNo === "undefined" ) req.body.metalNo = null;
          let newPersonnel = new personnel({
            personnelName: req.body.personnelName,
            company: req.body.companyID,
            rank: req.body.rank,
            metalNo: req.body.metalNo,
            battalion: req.decoded.battalion,
            dateOfBirth: req.body.dateOfBirth,
          });

          newPersonnel.save((err, result) => {
            if (err) {
              console.log(err);
              return res.status(500).json({ message: "Internal Server Error" });
            } else {
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
  async function (req, res) {
    if (req.decoded.priority == 3) {
      personnel
        .findOne({ _id: ObjectId(req.body.personnelID) })
        .then(async(matchedPersonnel) => {
          if (!matchedPersonnel)
            return res.status(403).json({ message: "Forbidded" });
          else {
            if (String(matchedPersonnel.company) === String(req.decoded.company)) {
              const matchedCompany = await company.findOne({_id:ObjectId(matchedPersonnel.company)});
              matchedCompany.personnel = matchedCompany.personnel.filter((val)=>String(val)!=String(req.body.personnelID));
              await matchedCompany.save((err,result)=>{
                if(err){
                  return res.status(500).json({message:"Internal Server Error"})}
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
                });
            
            } else return res.status(403).json({ message: "Unauthorized" });
          }
        })
        .catch((err) => {
          return res.status(500).json({ message: "Internal Server Error" });
        });
    } else{
      const matchedPersonnel = await personnel.findOne({_id:ObjectId(req.body.personnelID)});
      if(!matchedPersonnel) return res.status(400).json({message:"Invalid PersonnelID"})
      const matchedCompany = await company.findOne({_id:ObjectId(matchedPersonnel.company)});
      for(let i = 0; i<matchedCompany.personnel.length; i++){
        if(String(matchedCompany.personnel[i]) === String(req.body.personnelID)){
          matchedCompany.personnel.splice(i,1);
          i--;
        }
      }
      await company.updateOne({_id:ObjectId(matchedPersonnel.company)},{$set:{personnel:matchedCompany.personnel}});
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
  }
);

router.post("/changeCompany", AuthController.verify_token,
AuthController.is_authorized,
async function (req, res){
  try{
    const Personnel = await personnel.findOne({_id:ObjectId(req.body.personnelId)});
    if(!Personnel) return res.status(400).json({message:"Invalid Personnel Id"});
    const oldCompany = await company.findOne({_id:ObjectId(Personnel.company)});
    const Company = await company.findOne({_id:ObjectId(req.body.companyId)});
    if(!Company) return res.status(400).json({message:"Invalid Company Id"});
    if(req.decoded.priority < 2 || (
      req.decoded.priority == 2) && (
        String(req.decoded.battalion) == String(oldCompany.battalion)) && (
          String(req.decoded.battalion) == String(Company.battalion))
          ){
      //remove from old company
      let oldCompanyPersonnels = oldCompany.personnel; 
      for(let i = 0;i < oldCompanyPersonnels.length;i++){
        if(oldCompanyPersonnels[i] == req.body.personnelId){
          oldCompanyPersonnels.splice(i,1);
        }
      }
      //add to new company
      let newCompanyPersonnels = Company.personnel;
      newCompanyPersonnels.push(Personnel._id); 

      await personnel.updateOne({_id:ObjectId(req.body.personnelId)},{$set:{company:Company._id}},{$set:{battalion:Company.battalion}});//Update Personnel
      await company.updateOne({_id:ObjectId(oldCompany._id)},{$set:{personnel:oldCompanyPersonnels}})//Update old company
      await company.updateOne({_id:ObjectId(req.body.companyId)},{$set:{personnel:newCompanyPersonnels}})//Update new Company

      const updatedPersonnel = await personnel.findOne({_id:req.body.personnelId});
      res.status(200).json({
        message:"Company Changed Successfully",
        oldCompany:oldCompany._id,
        updatedCompany:updatedPersonnel.company
      });
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
