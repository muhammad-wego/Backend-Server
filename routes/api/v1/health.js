const express = require('express');
const router = express.Router();
const personnel = require('../../../models/personnel');
const personnelHealth = require('../../../models/personnelHealth');
const ObjectId = require('mongodb').ObjectId;
const AuthController = require('../../../contollers/AuthController');

router.post('/view',AuthController.verify_token,AuthController.is_authorized,function(req,res){
    let average = 0;
    const averagePromise = new Promise((resolve,reject) => {
        if(req.decoded.priority == 3) {
            personnel.find({company:ObjectId(req.decoded.company)}).then(personnels => {
                personnels.forEach((person,i) => {
                    personnelHealth.findOne({_id:ObjectId(person.lastEntry)}).then(matchedRecord => {
                        average += matchedRecord.score;
                        if(i == personnels.length-1) resolve(average/i);
                    }).catch(err => {
                        reject();
                    });
                })
            }).catch(err => {return res.status(500).json({message:"Internal Server Error"});});
        }
        else {
            personnel.find().then(personnels => {
                personnels.forEach((person,i) => {
                    console.log(person.lastEntry);
                    personnelHealth.findOne({_id:ObjectId(person.lastEntry)}).then(matchedRecord => {
                        average += matchedRecord.score;
                        if(i == personnels.length-1) resolve(average/i);
                    }).catch(err => {
                        reject(err);
                    });
                })
            }).catch(err => {return res.status(500).json({message:"Internal Server Error"});});
        }
    });

    averagePromise.then((average) => res.status(200).json({average}))
    .catch(err => {console.log(err);res.status(500).json({message:"Internal Server Error"})});
});

router.post('/add',AuthController.verify_token,AuthController.is_authorized,function(req,res){
    if(!ObjectId.isValid(req.body.personnelID)) return res.status(403).json({message:"Invalid Personnel"});
    personnel.findOne({_id:ObjectId(req.body.personnelID)}).then(matchedPersonnel => {
        if(!matchedPersonnel) return res.status(403).json({message:"Unauthorized"});
        else {
            if(req.decoded.priority < 3 || req.decoded.company == matchedPersonnel.company){
                let newHealthRep = new personnelHealth({
                    personnel : matchedPersonnel._id,
                    dateOfEntry : new Date().getTime(),
                    score : 10
                });
                req.body.parameters.forEach((param,i)=>{
                    if(!ObjectId.isValid(param.healthParameter)) return res.status(403).json({message:"Unauthorized"});
                    let currentParam = {};
                    currentParam.healthParameter = param.healthParameter;
                    if(typeof req.body.stage != 'undefined') currentParam.stage = param.stage;
                    if(typeof req.body.value != 'undefined') currentParam.value = param.value;
                    if(typeof req.body.presence != 'undefined') currentParam.presence = param.presence;                    
                    newHealthRep.parameters.push(currentParam);
                });
                newHealthRep.save((err,result) => {
                    if(err) return res.status(500).json({message:"Internal Server Error"});
                    matchedPersonnel.lastEntry = result._id;
                    if(typeof req.body.followUpRequired != 'undefined' && typeof req.body.followUpRequired == 'boolean') matchedPersonnel.followUpRequired = req.body.followUpRequired;
                    matchedPersonnel.save((err,_result) => {
                        if(err) return res.status(500).json({message:"Internal Server Error"});
                        return res.status(200).json({message:"Health Record Created"});
                    });
                });
            }
            else return res.status(403).json({message:"Unauthorized"});
        }
    }).catch(err => {return res.status(500).json({message:"Internal Server Error"});});
});

module.exports = router;