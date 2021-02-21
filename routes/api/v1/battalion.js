const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const battalion = require("../../../models/battalion");
const ObjectId = require("mongodb").ObjectId;
const AuthController = require("../../../contollers/AuthController");
const company = require("../../../models/company");
const personnel = require("../../../models/personnel");
const healthParameter = require("../../../models/healthParameter");
const personnelHealth = require("../../../models/personnelHealth");
const admin  = require("../../../models/admin");

router.post("/view/:id", AuthController.verify_token, function (req, res) {
  if (req.params.id == "all")
    battalion
      .find()
      .then(async(battalions) => {
        battalionsInfo=[]

        for(let bat of battalions){
          if(bat.admins.length>0)
          {
              var adminInfo = await admin.findById(ObjectId(bat.admins[0]));
              adminInfo.password = null;
              var batInfo ={...bat[`_doc`],adminInfo};
              battalionsInfo.push(batInfo);
          }
        }
          
        return res.status(200).json({ battalions,battalionsInfo });
        
        
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error" });
      });
  else
    battalion
      .findOne({ _id: req.params.id })
      .then((matchedBattalion) => {
        return res.status(200).json({ battalion: matchedBattalion });
      })
      .catch((err) => {
        return res.status(500).json({ message: "Internal Server Error" });
      });
});

router.post(
  "/add",
  AuthController.verify_token,
  AuthController.is_authorized,
  async function (req, res) {
    if (req.decoded.priority > 1)
      return res.status(403).json({ message: "Unauthorized" });
    let newBattalion = new battalion({
      battalionNumber: req.body.battalionNumber,
      location: req.body.battalionLocation,
    });
    const hash = await bcrypt.hash(req.body.adminPassword,10);

    const Batt = await battalion.find({battalionNumber:req.body.battalionNumber});
    if(Batt.length>0) return res.status(409).json({message:`Battalion ${req.body.battalionNumber} Already Exists`});

    newBattalion.save((err, result) => {
      if (err){
       return res.status(500).json({ message: "Internal Server Error1" });
      }
      else {
        let newAdmin = new admin({
          username: req.body.adminUsername,
          password: hash,
          priority: 2,
          battalion: result._id,
          company: null,
          location: req.body.adminLocation,
        });
        newAdmin.save((_err, adminResult) => {
          if (_err) {
            console.log(err);
            return res
              .status(500)
              .json({ message: "Internal Server Error2" });
          } else {
            result.admins.push(adminResult._id);
            result.save((__err, __result) => {
              if (__err) {
                console.log (__err);
                return res
                  .status(500)
                  .json({ message: "Internal Server Error3" });
              }
              return res
                .status(200)
                .json({ message: "Battalion Created" });
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
    try{
      if (req.decoded.priority > 1)
      return res.status(403).json({ message: "Unauthorized" });
      const Companies = await company.find({battalion:ObjectId(req.body.battalionID)});
      for(const c of Companies){
        await personnel.deleteMany({company:ObjectId(c._id)});
        await company.deleteOne({_id:ObjectId(c._id)});
      }
      await admin.deleteMany({battalion:ObjectId(req.body.battalionID)});
      battalion.deleteOne(
      { _id: ObjectId(req.body.battalionID) },
      (err, result) => {
        if (err)
          return res.status(500).json({ message: "Internal Server Error" });
        else return res.status(200).json({ message: "Battalion Removed" });
      }
    );
    }catch(err){
      console.log(err);
      return res.status(500).json({message:"Internal Server Error"});
    }   
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
    if(!req.body.battalion){
      req.body.battalion = req.decoded.battalion;
    }
    try {
      const adminCompany = await admin.findOne({
        username: String(req.decoded.username),
      });
      if (
        (req.decoded.priority === 2 &&
          String(adminCompany.battalion) == String(req.body.battalion) )||
        req.decoded.priority < 2
      ) {
        const Battalion = await battalion.findOne({
          _id: ObjectId(req.body.battalion),
        });
        if (!Battalion)
          return res.status(400).json({ message: "No such battalion" });
        let Personnels = new Array();
        let personnelScoresObj = {
          poor: 0,
          medium: 0,
          good: 0,
        };
        for (const cmpnyId of Battalion.companies) {
          const cmpny = await company.findOne({ _id: ObjectId(cmpnyId) });
          if (!cmpny) continue;
          for (const pId of cmpny.personnel) {
            const p = await personnel.findOne({ _id: ObjectId(pId) });
            if (!p) continue;
            Personnels.push(p);
          }
        }

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

          if (LastReport.score < 7) personnelScoresObj.poor += 1;
          else if (LastReport.score >= 7 && LastReport.score < 9)
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
        //DO NOT TOUCH
        let monthAvgWeightArr = new Array();
        const dateNow = new Date();
        const currentMonth = dateNow.getMonth();
        let currentYear = dateNow.getFullYear();
        let numberOfMonths = req.body.numberOfMonths;
        if (numberOfMonths > 70) return res.status(400).json({ message: "Number of months exceeded threshold of 70 months" });
        let tempMonth;
        for (let i = 0; i < numberOfMonths; i++) {
          if ((currentMonth - i) % 12 == -1 && currentMonth - i <= -1) currentYear--;
          if (currentMonth - i <= -1) {
            tempMonth = 11 - ((-(currentMonth + 1 - i)) % 12);
          }
          else {
            tempMonth = currentMonth - i;
          }
          const dateLessThan = new Date(String(currentYear) + "-" + String(tempMonth + 1) + "-" + String(31));
          const dateGreaterThan = new Date(String(currentYear) + "-" + String(tempMonth + 1) + "-" + String(1));
          //DO NOT TOUCH
          let TotalWeight = 0;
          let TotalRec= 0;
          for (const cmp of Battalion.companies) {
            const PersonHealthCurrMon = await personnel.aggregate([{
              $match: { "company": ObjectId(cmp) }
            },
            {
              $lookup: {
                from: "personnelhealths",
                as: "CurrMonRecs",
                let: { "pId": "$_id" },
                pipeline: [{
                  $match: {
                    $expr: {
                      $and: [{ $eq: [{ $toObjectId: "$personnel" }, { $toObjectId: "$$pId" }] },
                      { $gte: ["$dateOfEntry", dateGreaterThan] },
                      { $lte: ["$dateOfEntry", dateLessThan] }]
                    }
                  }
                }]
              }
            }, {
              $project: {
                "company": 1,
                "CurrMonRecs": {
                  "dateOfEntry": 1,
                  "weight": 1
                }
              }
            }
            ]);
            let weightSum = 0;
            let recCount = 0;
            for (const i of PersonHealthCurrMon) {
              console.log(i.company);
              if (i.CurrMonRecs.length != 0) {
                for (const j of i.CurrMonRecs) {
                  weightSum += j.weight;
                  recCount++;
                }
              }
            }
            TotalWeight += weightSum;
            TotalRec += recCount; 
          }
          monthlyAvgObj = {
            Month: tempMonth + 1,
            Year: currentYear,
            AverageWeight: parseFloat((TotalWeight/TotalRec).toFixed(2))
          }
          monthAvgWeightArr.push(monthlyAvgObj);
        }
        //Avg Weight over a specified number of months :Ends here
        return res.status(200).json({ HealthParamStages, personnelScoresObj,monthAvgWeightArr });
      } else return res.status(401).json({ message: "Unauthorized" });
    } catch (err) {
      console.log(err);
      return res.status(403).json({ message: "Internal Server Error" });
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
    if(!req.body.battalion){
      req.body.battalion = req.decoded.battalion;
    }
    try {
      const adminCompany = await admin.findOne({
        username: String(req.decoded.username),
      });
      if (
        (req.decoded.priority === 2 &&
          String(adminCompany.battalion)==String(req.body.battalion)) ||
        req.decoded.priority < 2
      ) {
        const Battalion = await battalion.findOne({
          _id: ObjectId(req.body.battalion),
        });
        if (!Battalion)
          return res.status(400).json({ message: "No such battalion" });

        let Personnels = new Array();
        for (const cmpnyId of Battalion.companies) {
          const cmpny = await company.findOne({ _id: ObjectId(cmpnyId) });
          if (!cmpny) continue;
          for (const pId of cmpny.personnel) {
            const p = await personnel.findOne({ _id: ObjectId(pId) });
            if (!p) continue;
            Personnels.push(p);
          }
        }

        let individualInfoArr = new Array();
        for (const p of Personnels) {
          const lastRecord = await personnelHealth.findOne({
            _id: ObjectId(p.allEntries[p.allEntries.length - 1]),
          });

          const rec4wt = await personnelHealth.findOne({
            _id: ObjectId(p.allEntries[p.allEntries - 2])
          });
          
          let lwt =0;
          if(rec4wt) {
            lwt = rec4wt.weight
          }

          let weight, height, score;
          if (!lastRecord) {
            weight = "No records";
            height = "No records";
            score = "No records";
          } else {
            weight = ((lastRecord.weight-lwt)/lastRecord.weight)*100;
            height = lastRecord.height;
            score = lastRecord.score;
          }
          const CompanyInfo = await company.findById(p.company);
          const individualInfoObj = {
            _id: p._id,
            metalNo: p.metalNo,
            Name: p.personnelName,
            Weight: weight-lwt,
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

router.post('/overview/all',AuthController.verify_token,
AuthController.is_authorized,
async function (req, res){
  try {
    if (req.decoded.priority === 1) {
      let personnelScoresObj = {
        poor: 0,
        medium: 0,
        good: 0,
      };
      const Personnels = await personnel.find();
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

        if (LastReport.score < 7) personnelScoresObj.poor += 1;
        else if (LastReport.score >= 7 && LastReport.score < 9)
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

        const PersonHealthCurrMon = await personnel.aggregate([
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
      monthlyAvgObj={
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
});

router.post(
  "/individualOverview/all",
  AuthController.verify_token,
  AuthController.is_authorized,
  async function (req, res) {
    if (!req.body.company) {
      req.body.company = req.decoded.company;
    }
    try {
      if (req.decoded.priority === 1) {
        const Personnels = await personnel.find();

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
          const BattalionInfo = await battalion.findById(p.battalion)
          let companyName ,battalionNumber;
          if(!CompanyInfo) companyName = null;
          else companyName = CompanyInfo.companyName
          if(!BattalionInfo) battalionNumber = null;
          else battalionNumber = BattalionInfo.battalionNumber
          const individualInfoObj = {
            _id: p._id,
            metalNo: p.metalNo,
            Name: p.personnelName,
            Weight: weight,
            height: height,
            Company: p.company,
            Battalion: p.battalion,
            battalionNumber : battalionNumber,
            companyName: companyName,
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

router.post('/overviewMonthly',
AuthController.verify_token,
AuthController.is_authorized,
async function (req, res){
    if (!req.body.company) {
      req.body.company = req.decoded.company;
    }
    if(!req.body.battalion){
      req.body.battalion = req.decoded.battalion;
    }
    try {
      console.log(req.body)
      const adminCompany = await admin.findOne({
        username: String(req.decoded.username),
      });
      if ((req.decoded.priority === 2 && String(adminCompany.battalion) == String(req.body.battalion) )||req.decoded.priority < 2){
        const dateLessThan = new Date(String(req.body.year)+"-"+String(req.body.month)+"-"+String(31));
        const dateGreaterThan = new Date(String(req.body.year)+"-"+String(req.body.month)+"-"+String(1));   
        const Battalion = await battalion.findOne({_id:req.body.battalion}); 
        const HealthParameters = await healthParameter.find();
        console.log(Battalion)
        let HealthParamStages = new Array();
        let personnelScoresObj = {
          poor: 0,
          medium: 0,
          good: 0,
        };
        let weightSum = 0
        let pcount = 0
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
        
        for(const company of Battalion.companies){
            const PersonHealthOfMonth = await personnel.aggregate([{
              $match:{"company":ObjectId(company)}
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
     

          for(const p of PersonHealthOfMonth){
            for(const ph of p.MonthlyRecs){

              if (ph.score < 7) personnelScoresObj.poor += 1;
              else if (ph.score >= 7 && ph.score < 9)
                personnelScoresObj.medium += 1;
              else personnelScoresObj.good += 1;

              weightSum += ph.weight;
              pcount += 1;
      
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
        }
      let avgWeight = parseFloat((weightSum/pcount).toFixed(2)); 
      res.status(200).json({HealthParamStages,personnelScoresObj,avgWeight});
      }else{
        return res.status(401).json({message:"Unauthorized"});
      }
  }catch(err){
    console.log(err);
    return res.status(500).json({message:"Internal Server Error"})
  }
});

router.post('/overviewMonthly/all',
AuthController.verify_token,
AuthController.is_authorized,
async function (req, res){
  try{
    if(req.decoded.priority == 1 ){
      const dateLessThan = new Date(String(req.body.year)+"-"+String(req.body.month)+"-"+String(31));
      const dateGreaterThan = new Date(String(req.body.year)+"-"+String(req.body.month)+"-"+String(1)); 

      const PersonHealthOfMonth = await personnel.aggregate([
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

        if (ph.score < 7) personnelScoresObj.poor += 1;
        else if (ph.score >= 7 && ph.score < 9)
          personnelScoresObj.medium += 1;
        else personnelScoresObj.good += 1;

        weightSum += ph.weight;
        pcount+=1;

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
