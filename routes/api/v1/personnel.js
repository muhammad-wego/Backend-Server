const express = require('express');
const router = express.Router();
const personnel = require('../../../models/personnel');
const company = require('../../../models/company');
const ObjectId = require('mongodb').ObjectId;
const AuthController = require('../../../contollers/AuthController');

router.post('/view/:id',AuthController.verify_token,function(req,res){
    if(req.params.id == 'all') {
        //if(req.decoded.priority == 1) 
            personnel.find().then(personnels => {return res.status(200).json({personnels});})
            .catch(err => {return res.status(500).json({message:"Internal Server Error"});});
        return res.status(403).json({message:"Unauthorized"});
    }
    else 
        personnel.findOne({_id:ObjectId(req.body.personnelID)}).then(matchedPersonnel => {return res.status(200).json({personnel:matchedPersonnel});})
        .catch(err => {return res.status(500).json({message:"Internal Server Error"});});
});

router.post('/add',AuthController.verify_token,AuthController.is_authorized,function(req,res){
    company.findOne({_id:ObjectId(req.body.companyID)}).then(matchedCompany => {
        if(!matchedCompany) return res.status(403).json({message:"Unauthorized"});
        else {
            if(req.decoded.priority == 3) req.body.companyID = req.decoded.company;
            let newPersonnel = new personnel({
                personnelName : req.body.personnelName,
                company : req.body.companyID,
                rank : req.body.rank,
                metalNo : req.body.metalNo,
                dateOfBirth : req.body.dateOfBirth
            });

            newPersonnel.save((err,result)=>{
                if(err) return res.status(500).json({message:"Internal Server Error"});
                else {
                    matchedCompany.personnel.push(result._id);
                    matchedCompany.save((err,result)=>{
                        if(err) return res.status(500).json({message:"Internal Server Error"});
                        else return res.status(200).json({message:"Personnel Saved"});
                    });
                }
            });
        }
    });
});

router.delete('/remove',AuthController.verify_token,AuthController.is_authorized,function(req,res){
    if(req.decoded.priority == 3) {
        personnel.findOne({_id:ObjectId(req.body.personnelID)}).then(matchedPersonnel => {
            if(!matchedPersonnel) return res.status(403).json({message:"Forbidded"});
            else {
                if(matchedPersonnel.company == req.decoded.company) {
                    personnel.deleteOne({_id:ObjectId(req.body.personnelID)},(err,result)=>{
                        if(err) return res.status(500).json({message:"Internal Server Error"});
                        return res.status(200).json({message:"Personnel Deleted"});
                    }).catch(err => {return res.status(500).json({message:"Internal Server Error"});});
                }
                else return res.status(403).json({message:"Unauthorized"});
            }
        }).catch(err=>{return res.status(500).json({message:"Internal Server Error"});});
    }
    else personnel.deleteOne({_id:ObjectId(req.body.personnelID)},(err,result)=>{
        if(err) return res.status(500).json({message:"Internal Server Error"});
        return res.status(200).json({message:"Personnel Deleted"});
    }).catch(err => {return res.status(500).json({message:"Internal Server Error"});});
});

module.exports = router;