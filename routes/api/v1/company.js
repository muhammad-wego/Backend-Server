const express = require("express");
const router = express.Router();
const company = require("../../../models/company");
const battalion = require("../../../models/battalion");
const admin = require("../../../models/admin");
const personnel = require("../../../models/personnel");
const healthParameter = require("../../../models/healthParameter");
const personnelHealth = require("../../../models/personnelHealth");
const bcrypt = require("bcrypt");
const ObjectId = require("mongodb").ObjectId;
const AuthController = require("../../../contollers/AuthController");
const { findOne } = require("../../../models/admin");

router.post(
  "/view/:id",
  AuthController.verify_token,
  AuthController.is_authorized,
  async function (req, res) {
    console.log(req.body)
    if(!req.body.battalion)
    {
      req.body.battalion = req.decoded.battalion;
    }
    if (req.params.id == "all") {
      console.log(req.decoded)
      let response = { companies: [] };
      if(!req.body.battalion)
      {
        return res.status(401).json({ message: "Unauthorized" });
      } 
      let companies = await company.find({battalion:ObjectId(req.body.battalion)});
      console.log(companies)
      if (!companies) {
        return res.status(500).json({ message: "Internal Server Error" });
      }

      for (let comp of companies) {
        let compadmin = await admin.find({ company: comp._id });
        if (!compadmin) {
        } else {
          comp = comp.toJSON();
          comp.admins = [];
          compadmin.forEach((admin, i) => {
            admin = admin.toJSON();
            delete admin.password;
            comp.admins.push(admin);
          });
          response.companies.push(comp);
        }
      }

      return res.status(200).send(response);

      // const companyProm = new Promise((resolve, reject) => {
      //   company
      //     .find()
      //     .then(async (companies) => {
      //       companies.forEach((com, i) => {
      //         admin
      //           .find({ company: com._id })
      //           .then((admins) => {
      //             com = com.toJSON();
      //             com.admins = [];
      //             admins.forEach((admin, i) => {
      //               admin = admin.toJSON();
      //               delete admin.password;
      //               com.admins.push(admin);
      //             });
      //             response.companies.push(com);
      //             resolve(response);
      //           })
      //           .catch((err) => {
      //             return res
      //               .status(500)
      //               .json({ message: "Internal Server Error" });
      //           });
      //       });
      //     })
      //     .catch((err) => {
      //       return res.status(500).json({ message: "Internal Server Error" });
      //     });
      // }).then((resp) => {
      //   return res.status(200).send(resp);
      // });
    } else
      company
        .findOne({ _id: req.params.id })
        .then((matchedCompany) => {
          admin
            .find({ company: matchedCompany._id })
            .then((admins) => {
              return res.status(200).json({ company: matchedCompany, admins });
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

router.post("/add", AuthController.verify_token,AuthController.is_authorized, function (req, res) {
  if(!req.body.battalion)
  {
    req.body.battalion = req.decoded.battalion;
  }
  if (req.decoded.priority > 2)
    return res.status(403).json({ message: "Unauthorized" });
  battalion
    .findOne({ _id: ObjectId(req.body.battalion) })
    .then(async (matchedBattalion) => {
      if (!matchedBattalion)
        return res.status(403).json({ message: "Unauthorized" });
      else {
        if (!ObjectId.isValid(req.body.battalion))
          return res.status(403).json({ message: "Invalid Battalion" });

        let duplicate = await company.findOne({
          companyName: req.body.companyName,
        });
        if (duplicate) {
          console.log("duplicated");
          return res.status(409).json({
            message: `Company ${req.body.companyName} Already Exists`,
          });
        }
        let newCompany = new company({
          companyName: req.body.companyName,
          battalion: ObjectId(req.body.battalion),
        });

        newCompany.save((err, companyResult) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ message: "Internal Server Error" });
          } else {
            matchedBattalion.companies.push(companyResult._id);
            matchedBattalion.save((err, battalionResult) => {
              if (err) {
                console.log(err);
                return res
                  .status(500)
                  .json({ message: "Internal Server Error" });
              } else {
                bcrypt.hash(
                  req.body.adminPassword,
                  10,
                  function (err, hash) {
                    if (err) {
                      console.log(err);
                      return res
                        .status(500)
                        .json({ message: "Internal Server Error" });
                    } else {
                      let newAdmin = new admin({
                        username: req.body.adminUsername,
                        password: hash,
                        priority: 3,
                        battalion: battalionResult._id,
                        company: companyResult._id,
                        location: req.body.location,
                      });

                      newAdmin.save((err, adminResult) => {
                        if (err) {
                          console.log(err);
                          return res
                            .status(500)
                            .json({ message: "Internal Server Error" });
                        } else {
                            res.status(200).json({message:"Company Created"});
                        }
                      });
                    }
                  }
                );
                //let newPersonnel = new personnel({
                //  personnelName: req.body.adminName,
                //  company: companyResult._id,
                //  metalNo: req.body.adminName,
                //});
/*
                newPersonnel.save((err, personnelResult) => {
                  if (err) {
                    console.log(err);
                    return res
                      .status(500)
                      .json({ message: "Internal Server Error" });
                  } else {
                    bcrypt.hash(
                      req.body.adminPassword,
                      10,
                      function (err, hash) {
                        if (err) {
                          console.log(err);
                          return res
                            .status(500)
                            .json({ message: "Internal Server Error" });
                        } else {
                          companyResult.personnel.push(personnelResult._id);
                          companyResult.save((err, result) => {
                            if (err) {
                              console.log(err);
                              return res
                                .status(500)
                                .json({ message: "Internal Server Error" });
                            }
                          });
                          let newAdmin = new admin({
                            username: req.body.adminUsername,
                            password: hash,
                            priority: 3,
                            personnelInfo: personnelResult._id,
                            battalion: req.body.battalion,
                            company: companyResult._id,
                            location: req.body.location,
                          });

                          newAdmin.save((err, adminResult) => {
                            if (err) {
                              console.log(err);
                              return res
                                .status(500)
                                .json({ message: "Internal Server Error" });
                            } else {
                              companyResult.personnel.push(adminResult._id);
                              companyResult.save((err, result) => {
                                if (err) {
                                  console.log(err);
                                  return res
                                    .status(500)
                                    .json({ message: "Internal Server Error" });
                                }
                                return res
                                  .status(200)
                                  .json({ message: "Company Created" });
                              });
                            }
                          });
                        }
                      }
                    );
                  }
                });*/
              }
            });
          }
        });
      }
    })
    .catch((err) => {
      console.log("Error Fetching Battalion : " + err);
      return res.status(500).json({ message: "Internal Server Error" });
    });
});

router.delete("/remove", AuthController.verify_token, function (req, res) {
  if (req.decoded.priority > 2)
    return res.status(403).json({ message: "Unauthorized" });

  personnel
    .deleteMany({ company: ObjectId(req.body.companyID) }, (err, result) => {
      if (err) res.status(500).json({ message: "Internal Server Error" });

      company.deleteOne({ _id: ObjectId(req.body.company) }, (err, result) => {
        console.log(result);
        if (err) res.status(500).json({ message: "Internal Server Error" });
        return res.status(200).json({ message: "Company Deleted" });
      });
    })
    .catch((err) => {
      if (err) console.log(err);
    });
});

router.post(
  "/admin/add",
  AuthController.verify_token,
  AuthController.is_authorized,
  function (req, res) {
    if (req.decoded.priority > 2)
      return res.status(403).json({ message: "Unauthorized" });
    bcrypt.hash(req.body.adminPassword, 10, function (err, hash) {
      if (err)
        return res.status(500).json({ message: "Internal Server Error" });
      else {
        let newAdmin = new admin({
          username: req.body.adminUsername,
          password: hash,
          priority: 3,
          personnelInfo: req.body.personnelID,
          battalion: req.body.battalion,
          company: req.body.company,
        });

        newAdmin.save((err, result) => {
          console.log(err);
          if (err)
            return res.status(500).json({ message: "Internal Server Error" });
          else return res.status(200).json({ message: "Admin Added" });
        });
      }
    });
  }
);

router.delete(
  "/admin/remove",
  AuthController.verify_token,
  AuthController.is_authorized,
  function (req, res) {
    if (req.decoded.priority > 2)
      return res.status(403).json({ message: "Unauthorized" });
    admin.deleteOne({ _id: ObjectId(req.body.adminID) }, (err, result) => {
      if (err)
        return res.status(500).json({ message: "Internal Server Error" });
      return res.status(200).json({ message: "Admin Removed" });
    });
  }
);

router.post(
  "/overview",
  AuthController.verify_token,
  AuthController.is_authorized,
  async function (req, res) {
    if (!req.body.company) {
      req.body.company = req.decoded.company;
    }
    try {
      if (
        (req.decoded.priority === 3 &&
          req.decoded.company == req.body.company) ||
        req.decoded.priority < 3
      ) {
        const Company = await company.findOne({
          _id: ObjectId(req.body.company),
        });
        let personnelScoresObj = {
          poor: 0,
          medium: 0,
          good: 0,
        };
        if (!Company)
          return res.status(400).json({ message: "No Company Found" });
        const Personnels = await personnel.find({
          company: ObjectId(req.body.company),
        });
        const HealthParameters = await healthParameter.find();
        let HealthParamStages = new Array();
        for (const Parameter of HealthParameters) {
          let paramObj = {
            ParameterId:Parameter._id,
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

          if (LastReport.score < 4) personnelScoresObj.poor += 1;
          else if (LastReport.score >= 4 && LastReport.score < 7)
            personnelScoresObj.medium += 1;
          else personnelScoresObj.good += 1;

          for (const LReportParameter of LastReport.parameters) {
            const HParameter = await healthParameter.findOne({
              _id: ObjectId(LReportParameter.healthParameter),
            });
            if (HParameter) {
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
        }

        //Avg Weight over a specified number of months :Starts here
        let monthAvgWeightArr = new Array();
        const dateNow = new Date();
        const currentMonth = dateNow.getMonth();
        let currentYear = dateNow.getFullYear();
        let numberOfMonths = req.body.numberOfMonths;
        if(numberOfMonths > 70) return res.status(400).json({message:"Number of months exceeded threshold of 70 months"});
        let tempMonth;
        for(let i = 0 ; i<numberOfMonths;i++){
          if((currentMonth - i)%12 == -1 && currentMonth - i<= -1)  currentYear -- ;
          if(currentMonth - i<= -1){              
              tempMonth = 11 - ((-(currentMonth +1 - i))%12) ;
          }
          else{
              tempMonth = currentMonth - i;
          }
          const dateLessThan = new Date(String(currentYear)+"-"+String(tempMonth+1)+"-"+String(31));
          const dateGreaterThan = new Date(String(currentYear)+"-"+String(tempMonth+1)+"-"+String(1));

          const PersonHealthCurrMon = await personnel.aggregate([{
            $match:{"company":ObjectId(req.body.company)}
            },
            {
              $lookup:{
                from:"personnelhealths",
                as:"CurrMonRecs",
                let:{"pId":"$_id"},
                pipeline:[{
                  $match:{$expr:{$and:[{$eq:[{$toObjectId:"$personnel"},{$toObjectId:"$$pId"}]},
                  {$gte:["$dateOfEntry",dateGreaterThan]},
                  {$lte:["$dateOfEntry",dateLessThan]}]}}
                }]
              }
            },{
              $project:{
                "company":1,
                "CurrMonRecs":{
                  "dateOfEntry":1,
                  "weight":1
                }
              }
          }
        ]);
        let weightSum = 0;
        let recCount = 0;
        for(const i of PersonHealthCurrMon){
          if(i.CurrMonRecs.length!=0){
            for(const j of i.CurrMonRecs){
              weightSum+=j.weight;
              recCount++;
            }
          }
        }
        let monthlyAvgObj={
          Month:tempMonth+1,
          Year:currentYear,
          AverageWeight:parseFloat((weightSum/recCount).toFixed(2))
        }
        monthAvgWeightArr.push(monthlyAvgObj);
      }
        //Avg Weight over a specified number of months :Ends here
        return res.status(200).json({ HealthParamStages, personnelScoresObj,monthAvgWeightArr });
      } else return res.status(401).json({ message: "Unauthorized" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

router.post(
  "/individualOverview",
  AuthController.verify_token,
  AuthController.is_authorized,
  async function (req, res) {
    if (!req.body.company) {
      req.body.company = req.decoded.company;
    }
    try {
      if (req.decoded.priority < 3 || req.decoded.company == req.body.company) {
        const Personnels = await personnel.find({
          company: ObjectId(req.body.company),
        });
        let individualInfoArr = new Array();
        for (const p of Personnels) {
          const lastRecord = await personnelHealth.findOne({
            _id: ObjectId(p.allEntries[p.allEntries.length - 1]),
          });
          console.log(lastRecord);
          let weight, height, score;
          if (!lastRecord) {
            weight = "No records";
            height = "No records";
            score = "No records";
          } else {
            weight = lastRecord.weight;
            height = lastRecord.height;
            score = lastRecord.score;
          }
          const CompanyInfo = await company.findById(p.company);
          const individualInfoObj = {
            _id: p._id,
            metalNo: p.metalNo,
            Name: p.personnelName,
            Weight: weight,
            height: height,
            Company: p.company,
            companyName: CompanyInfo.companyName,
            rank: p.rank,
            Score: score,
          };
          individualInfoArr.push(individualInfoObj);
        }
        res.status(200).json({ individualInfoArr });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal Server Error", err });
    }
  }
);

router.get(
  "/showPersonnels",
  AuthController.verify_token,
  AuthController.is_authorized,
  async function (req, res) {
    try {
      if (
        req.decoded.priority < 3 ||
        (req.decoded.priority == 3 && req.decoded.company == req.body.company)
      ) {
        const Personnels = personnel.find({ company: req.body.company });
        return res.status(200).json({ Personnels });
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    } catch (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/addAdmins",
  AuthController.verify_token,
  AuthController.is_authorized,
  async function (req, res) {
    try {
      const adminCompany = await company.findOne({
        _id: ObjectId(req.decoded.company),
      });
      //if(!adminCompany) return res.status(400).json({message:"No adminCompany"});
      const Company = await company.findOne({
        _id: ObjectId(req.body.company),
      });
      if (!Company)
        return res.status(400).json({ message: "No Company Present" });
      if (
        req.decoded.priority < 2 ||
        (req.decoded.priority == 2 &&
          adminCompany.battalion == Company.battalion)
      ) {
        let unaddedPersonnels = new Array();
        let newAdmins = new Array();
        for (const p of req.body.Personnels) {
          const Personnel = await personnel.findOne({ _id: ObjectId(p.pId) });
          if (Personnel.company == req.body.company) {
            try {
              const hash = await bcrypt.hash(p.password, 10);
              let newAdmin = new admin({
                username: p.username,
                password: hash,
                company: req.body.company,
                battalion: Company.battalion,
                personnelID: ObjectId(p.pId),
                priority: p.priority,
              });
              console.log(hash);
              await newAdmin.save();
              newAdmins.push({
                PersonnelId: Personnel._id,
                PersonnelName: Personnel.personnelName,
              });
            } catch (err) {
              console.log(err);
              unaddedPersonnels.push({
                PersonnelId: Personnel._id,
                PersonnelName: Personnel.personnelName,
              });
            }
          } else {
            unaddedPersonnels.push({
              PersonnelId: Personnel._id,
              PersonnelName: Personnel.personnelName,
            });
          }
        }
        res.status(200).json({
          newAdmins,
          unaddedPersonnels,
        });
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    } catch (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/getAdmins",
  AuthController.verify_token,
  AuthController.is_authorized,
  async function (req, res) {
    try {
      if (
        req.decoded.priority < 3 ||
        (req.decoded.priority == 3 && req.decoded.company == req.body.company)
      ) {
        const Admins = await admin.find({ company: req.body.company });
        res.status(200).json({ Admins });
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

router.post(
  "/removeAdmin",
  AuthController.verify_token,
  AuthController.is_authorized,
  async function (req, res) {
    try {
      const adminCompany = await company.findOne({
        _id: ObjectId(req.decoded.company),
      });
      //if(!adminCompany) return res.status(400).json({message:"No adminCompany"});
      const Company = await company.findOne({
        _id: ObjectId(req.body.company),
      });
      if (!Company)
        return res.status(400).json({ message: "No Company Present" });
      if (
        req.decoded.priority < 2 ||
        (req.decoded.priority == 2 &&
          adminCompany.battalion == Company.battalion)
      ) {
        const Admin = await admin.findOne({ _id: ObjectId(req.body.adminId) });
        if (!Admin)
          return res.status(401).json({ message: "Incorrect Admin Id" });
        if (String(Admin.company) != String(req.body.company)) {
          return res.status(401).json({
            message:
              "Cannot Process Request as Admin is not from requested company",
          });
        }
        try {
          await admin.deleteOne({ _id: ObjectId(req.body.adminId) });
          res.status(200).json({
            message: "Admin status of personnel removed successfully",
          });
        } catch (err) {
          console.log(err);
          return res.status(500).json({ message: "Deletion failed" });
        }
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

router.post('/overviewMonthly',AuthController.verify_token,
AuthController.is_authorized,
async function (req, res){
  try{
    if (!req.body.company) {
      req.body.company = req.decoded.company;
    }
    if(req.decoded.priority < 3 || (req.decoded.priority===3 && String(req.decoded.company)==String(req.body.company))){
      const dateLessThan = new Date(String(req.body.year)+"-"+String(req.body.month)+"-"+String(31));
      const dateGreaterThan = new Date(String(req.body.year)+"-"+String(req.body.month)+"-"+String(1)); 
      const PersonHealthOfMonth = await personnel.aggregate([{
        $match:{"company":ObjectId(req.body.company)}
        },
        {
          $lookup:{
            from:"personnelhealths",
            as:"MonthlyRecs",
            let:{"pId":"$_id"},
            pipeline:[{
              $match:{$expr:{$and:[{$eq:[{$toObjectId:"$personnel"},{$toObjectId:"$$pId"}]},
              {$gte:["$dateOfEntry",dateGreaterThan]},
              {$lte:["$dateOfEntry",dateLessThan]}]}}
            }]
          }
        },{
          $project:{
            "company":1,
            "MonthlyRecs":{
              "dateOfEntry":1,
              "weight":1,
              "parameters":1,
              "score":1
            }
          }
      }
    ]);
    let personnelScoresObj = {
      poor: 0,
      medium: 0,
      good: 0,
    };
    let weightSum = 0
    let pcount = 0
    const HealthParameters = await healthParameter.find();
    let HealthParamStages = new Array();
    for (const Parameter of HealthParameters) {
      let paramObj = {
        ParameterId : Parameter._id,
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
    for(const p of PersonHealthOfMonth){
      for(const ph of p.MonthlyRecs){

        if (ph.score < 4) personnelScoresObj.poor += 1;
        else if (ph.score >= 4 && ph.score < 7)
          personnelScoresObj.medium += 1;
        else personnelScoresObj.good += 1;

        weightSum+=ph.weight
        pcount+=1

        for(const hp of ph.parameters){
          for(const param of HealthParamStages){
            if(String(hp.healthParameter) == String(param.ParameterId)){
              for(const stage of param.stages){
                if(hp.stage == stage.StageName){
                  stage.count+=1;
                  break;
                }
              }
              break;
            }
          }
        }
      }
       
    }
    let avgWeight = parseFloat((weightSum/pcount).toFixed(2)); 
    res.status(200).json({HealthParamStages,personnelScoresObj,avgWeight});

    }else{
      return res.staus(401).json({message:"Unauthorized"});
    }
  }catch(err){
    console.log(err);
    return res.status(500).json({message:"Internal Server Error"});
  }
});

module.exports = router;
