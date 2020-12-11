const express = require('express');
const router = express.Router();
const company = require('../../../models/company');
const battalion = require('../../../models/battalion');
const admin = require('../../../models/admin');
const personnel = require('../../../models/personnel');
const healthParameter = require('../../../models/healthParameter');
const personnelHealth = require('../../../models/personnelHealth');
const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;
const AuthController = require('../../../contollers/AuthController');

router.post('/view/:id', AuthController.verify_token, function (req, res) {
  if (req.params.id == 'all') {
    let response = { companies: [] };
    const companyProm = new Promise((resolve, reject) => {
      company.find().then(companies => {
        companies.forEach((com, i) => {
          admin.find({ company: com._id }).then(admins => {
            com = com.toJSON();
            com.admins = [];
            admins.forEach((admin, i) => {
              admin = admin.toJSON();
              delete admin.password;
              com.admins.push(admin);
            });
            response.companies.push(com);
            resolve(response);
          }).catch(err => { return res.status(500).json({ message: "Internal Server Error" }); });
        });
      }).catch(err => { return res.status(500).json({ message: "Internal Server Error" }); });
    })
      .then((resp) => { return res.status(200).send(resp) });
  }
  else
    company.findOne({ _id: req.params.id }).then(matchedCompany => {
      admin.find({ company: matchedCompany._id }).then(admins => {
        return res.status(200).json({ company: matchedCompany, admins });
      }).catch(err => { return res.status(500).json({ message: "Internal Server Error" }); });
    })
      .catch(err => { return res.status(500).json({ message: "Internal Server Error" }); });
});

router.post('/add', AuthController.verify_token, function (req, res) {
  if (req.decoded.priority > 2) return res.status(403).json({ message: "Unauthorized" });
  battalion.findOne({ _id: ObjectId(req.body.battalion) }).then(matchedBattalion => {
    if (!matchedBattalion) return res.status(403).json({ message: "Unauthorized" });
    else {
      if (!ObjectId.isValid(req.body.battalion)) return res.status(403).json({ message: "Invalid Battalion" });
      let newCompany = new company({
        companyName: req.body.companyName,
        battalion: ObjectId(req.body.battalion)
      });

      newCompany.save((err, companyResult) => {
        if (err) return res.status(500).json({ message: "Internal Server Error" });
        else {
          matchedBattalion.companies.push(companyResult._id);
          matchedBattalion.save((err, battalionResult) => {
            if (err) return res.status(500).json({ message: "Internal Server Error" });
            else {
              let newPersonnel = new personnel({
                personnelName: req.body.adminName,
                company: companyResult._id
              });

              newPersonnel.save((err, personnelResult) => {
                if (err) return res.status(500).json({ message: "Internal Server Error" });
                else {
                  bcrypt.hash(req.body.adminPassword, 10, function (err, hash) {
                    if (err) return res.status(500).json({ message: "Internal Server Error" });
                    else {
                      companyResult.personnel.push(personnelResult._id);
                      companyResult.save((err, result) => { if (err) return res.status(500).json({ message: "Internal Server Error" }); });
                      let newAdmin = new admin({
                        username: req.body.adminUsername,
                        password: hash,
                        priority: 3,
                        personnelInfo: personnelResult._id,
                        battalion: req.body.battalion,
                        company: companyResult._id,
                        location: req.body.location
                      });

                      newAdmin.save((err, adminResult) => {
                        if (err) return res.status(500).json({ message: "Internal Server Error" });
                        else {
                          companyResult.personnel.push(adminResult._id);
                          companyResult.save((err, result) => {
                            if (err) return res.status(500).json({ message: "Internal Server Error" });
                            return res.status(200).json({ message: "Company Created" });
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  }).catch(err => {
    console.log("Error Fetching Battalion : " + err);
    return res.status(500).json({ message: "Internal Server Error" });
  })
});

router.delete('/remove', AuthController.verify_token, function (req, res) {
  if (req.decoded.priority > 2) return res.status(403).json({ message: "Unauthorized" });
  company.deleteOne({ _id: ObjectId(req.body.companyID) }, (err, result) => {
    if (err) return res.status(500).json({ message: "Internal Server Error" });
    else return res.status(200).json({ message: "Company Removed" });
  });
});

router.post('/admin/add', AuthController.verify_token, AuthController.is_authorized, function (req, res) {
  if (req.decoded.priority > 2) return res.status(403).json({ message: "Unauthorized" });
  bcrypt.hash(req.body.adminPassword, 10, function (err, hash) {
    if (err) return res.status(500).json({ message: "Internal Server Error" });
    else {
      let newAdmin = new admin({
        username: req.body.adminUsername,
        password: hash,
        priority: 3,
        personnelInfo: req.body.personnelID,
        battalion: req.body.battalion,
        company: req.body.company
      });

      newAdmin.save((err, result) => {
        console.log(err);
        if (err) return res.status(500).json({ message: "Internal Server Error" });
        else return res.status(200).json({ message: "Admin Added" });
      });
    }
  })
});

router.delete('/admin/remove', AuthController.verify_token, AuthController.is_authorized, function (req, res) {
  if (req.decoded.priority > 2) return res.status(403).json({ message: "Unauthorized" });
  admin.deleteOne({ _id: ObjectId(req.body.adminID) }, (err, result) => {
    if (err) return res.status(500).json({ message: "Internal Server Error" });
    return res.status(200).json({ message: "Admin Removed" });
  });
});

router.post(
  "/overview",
  AuthController.verify_token,
  AuthController.is_authorized,
  async function (req, res) {
    if (!req.body.company) {
      req.body.company = req.decoded.company;
    }
    try {
      if ((req.decoded.priority === 3 && req.decoded.company == req.body.company) || req.decoded.priority < 3) {
        const Company = await company.findOne({
          _id: ObjectId(req.body.company),
        });
        let personnelScoresObj = {
          poor:0,
          medium:0,
          good:0
        }
        if (!Company)
          return res.status(400).json({ message: "No Company Found" });
        const Personnels = await personnel.find({
          company: ObjectId(req.body.company),
        });
        const HealthParameters = await healthParameter.find();
        let HealthParamStages = new Array();
        for (const Parameter of HealthParameters) {
          let paramObj = {
            ParameterName: Parameter.name,
            stages: new Array(),
          };
          for (const Stage of Parameter.stages) {
            let stageObj = {
              StageName: Stage.name,
              count: 0,
            };
            paramObj.stages.push(stageObj);
          }
          HealthParamStages.push(paramObj);
        }
        for (const Personnel of Personnels) {
          const LastReport = await personnelHealth.findOne({
            _id: ObjectId(
              Personnel.allEntries[Personnel.allEntries.length - 1]
            ),
          });
          if (!LastReport) continue;

          if(LastReport.score < 4) personnelScoresObj.poor+=1;
          else if(LastReport.score >= 4 && LastReport.score < 7) personnelScoresObj.medium+=1;
          else personnelScoresObj.good+=1;

          for (const LReportParameter of LastReport.parameters) {
            const HParameter = await healthParameter.findOne({
              _id: ObjectId(LReportParameter.healthParameter),
            });
            for (const HealthParamStage of HealthParamStages) {
              if (HParameter.name == HealthParamStage.ParameterName) {
                const currentParam = HealthParamStage;
                for (const currentStage of currentParam.stages) {
                  if (LReportParameter.stage == currentStage.StageName) {
                    currentStage.count += 1;
                  }
                }
              }
            }
          }
        }

        return res.status(200).json({ HealthParamStages,personnelScoresObj });
      }
      else return res.status(401).json({message:"Unauthorized"});
    } catch (err) {
      console.log(err);
      return res.status(403).json({ message: "Internal Server Error" });
    }
  }
);

router.post("/individualOverview",
AuthController.verify_token,
AuthController.is_authorized,
async function (req, res){
  try{
    if(req.decoded.priority<3 || req.decoded.company == req.body.company){
      const Peronnels = await personnel.find({company:ObjectId(req.body.company)})
      let personnelsArr = new Array();
      for(const p of Personnels){
        //TO BE DONE
      }
    }
  }catch(err){
    console.log(err);
    return res.status(500).json({message:"Internal Server Error",err});
  }
}); 

module.exports = router;