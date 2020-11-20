const express = require('express');
const router = express.Router();
const company = require('../../../models/company');
const battalion = require('../../../models/battalion');
const admin = require('../../../models/admin');
const personnel = require('../../../models/personnel');
const ObjectId = require('mongodb').ObjectId;
const AuthController = require('../../../contollers/AuthController');

router.post('/view/:id',AuthController.verify_token,function(req,res){
    if(req.params.id == 'all')
        company.find().then(companies => {return res.status(200).json({companies});})
        .catch(err => {return res.status(500).json({message:"Internal Server Error"});});
    else 
        company.findOne({_id:req.params.id}).then(matchedCompany => {return res.status(200).json({company:matchedCompany});})
        .catch(err => {return res.status(500).json({message:"Internal Server Error"});});
});

router.post('/add',AuthController.verify_token,function(req,res){
    battalion.findOne({_id:ObjectId(req.body.battalion)}).then(matchedBattalion => {
        if(!matchedBattalion) return res.status(403).json({message:"Unauthorized"});
        else {
            if(!ObjectId.isValid(req.body.battalion)) return res.status(403).json({message:"Invalid Battalion"});
            let newCompany = new company({
                companyName:req.body.companyName,
                battalion:req.body.battalion
            });
        
            newCompany.save((err,companyResult)=>{
                if(err) return res.status(500).json({message:"Internal Server Error"});
                else {
                    matchedBattalion.companies.push(companyResult._id);
                    matchedBattalion.save((err,battalionResult)=>{
                        if(err) return res.status(500).json({message:"Internal Server Error"});
                        else {
                            let newPersonnel = new personnel({
                                personnelName : req.body.adminName,
                                company : companyResult._id
                            });

                            newPersonnel.save((err,personnelResult) => {
                                if(err) return res.status(500).json({message:"Internal Server Error"});
                                else {
                                    let newAdmin = new admin({
                                        username : req.body.adminUsername,
                                        password : req.body.adminPassword,
                                        priority : 3,
                                        battalion : req.body.battalion
                                    });

                                    newAdmin.save((err,result)=>{
                                        if(err) return res.status(500).json({message:"Internal Server Error"});
                                        else return res.status(200).json({message:"Company Created"});
                                    });
                                }
                            })
                        }
                    });
                }
            });
        }
    }).catch(err => {
        console.log("Error Fetching Battalion : " + err);
        return res.status(500).json({message:"Internal Server Error"});
    })
});

router.delete('/remove',AuthController.verify_token,function(req,res){
    company.deleteOne({_id:ObjectId(req.body.companyID)},(err,result)=>{
        if(err) return res.status(500).json({message:"Internal Server Error"});
        else return res.status(200).json({message:"Company Removed"});
    });
});

module.exports = router;