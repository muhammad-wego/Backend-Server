const express = require('express');
const router = express.Router();
const battalion = require('../../../models/battalion');
const ObjectId = require('mongodb').ObjectId;
const AuthController = require('../../../contollers/AuthController');
const company = require('../../../models/company');
const personnel = require('../../../models/personnel');
const healthParameter = require('../../../models/healthParameter');
const personnelHealth = require('../../../models/personnelHealth');

router.post('/view/:id',AuthController.verify_token,function(req,res){
    if(req.params.id == 'all')
        battalion.find().then(battalions => {return res.status(200).json({battalions});})
        .catch(err => {return res.status(500).json({message:"Internal Server Error"});});
    else 
        battalion.findOne({_id:req.params.id}).then(matchedBattalion => {return res.status(200).json({battalion:matchedBattalion});})
        .catch(err => {return res.status(500).json({message:"Internal Server Error"});});
});

router.post('/add',AuthController.verify_token,AuthController.is_authorized,function(req,res){
    if(req.decoded.priority > 1) return res.status(403).json({message:"Unauthorized"});
    let newBattalion = new battalion({
        battalionNumber : req.body.battalionNumber,
        location : req.body.location
    });

    newBattalion.save((err,result)=>{
        if(err) return res.status(500).json({message:"Internal Server Error"});
        else return res.status(200).json({message:"Battalion Saved"});
    });
});

router.delete('/remove',AuthController.verify_token,AuthController.is_authorized,function(req,res){
    if(req.decoded.priority > 1) return res.status(403).json({message:"Unauthorized"});
    battalion.deleteOne({_id:ObjectId(req.body.battalionID)},(err,result)=>{
        if(err) return res.status(500).json({message:"Internal Server Error"});
        else return res.status(200).json({message:"Battalion Removed"});
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
          const adminCompany = company.findOne({_id:ObjectId(req.decoded.company)});
        if ((req.decoded.priority === 2 && adminCompany.battalion == req.body.battalion) || req.decoded.priority < 2) {
          const Battalion = await battalion.findOne({_id:ObjectId(req.body.battalion)});
          if(!Battalion) return res.status(400).json({message:"No such battalion"});
          let Personnels = new Array();
          let personnelScoresObj = {
               poor:0,
               medium:0,
               good:0
          }
          for(const cmpnyId of Battalion.companies){
            const cmpny = await company.findOne({_id:ObjectId(cmpnyId)});
            if(!cmpny) continue;
            for(const pId of cmpny.personnel){
                const p = await personnel.findOne({_id:ObjectId(pId)});
                if(!p) continue
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
    
    const adminCompany = company.findOne({_id:ObjectId(req.decoded.company)});
    if ((req.decoded.priority === 2 && adminCompany.battalion == req.body.battalion) || req.decoded.priority < 2) {
      const Battalion = await battalion.findOne({_id:ObjectId(req.body.battalion)});
      if(!Battalion) return res.status(400).json({message:"No such battalion"});

      let Personnels = new Array();
      for(const cmpnyId of Battalion.companies){
        const cmpny = await company.findOne({_id:ObjectId(cmpnyId)});
        if(!cmpny) continue;
        for(const pId of cmpny.personnel){
            const p = await personnel.findOne({_id:ObjectId(pId)});
            if(!p) continue
            Personnels.push(p);
        }
      }


      let individualInfoArr = new Array();
      for(const p of Personnels){
        const lastRecord = await personnelHealth.findOne({_id:ObjectId(p.allEntries[p.allEntries.length-1])});
        let weight,height,score;
        if(!lastRecord) {
           weight = "No records";
           height = "No records";
           score = "No records";
        }
        else{
          weight = lastRecord.weight;
          height = lastRecord.height;
          score = lastRecord.score
        }
        const individualInfoObj = {
          metalNo:p.metalNo,
          Name:p.Name,
          Weight : weight,
          height : height,
          Company : p.company,
          Score : score          
        };
        individualInfoArr.push(individualInfoObj);
      }
      res.status(200).json({individualInfoArr});
    }
  }catch(err){
    console.log(err);
    return res.status(500).json({message:"Internal Server Error",err});
  }
}); 

module.exports = router;