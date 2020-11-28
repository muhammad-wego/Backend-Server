const express = require('express');
const router = express.Router();
const company = require('../../../models/company');
const battalion = require('../../../models/battalion');
const admin = require('../../../models/admin');
const personnel = require('../../../models/personnel');
const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;
const AuthController = require('../../../contollers/AuthController');

router.post('/view/:id',AuthController.verify_token,function(req,res){
    if(req.params.id == 'all'){
        let response = {companies:[]};
        const companyProm = new Promise((resolve,reject) => {
            company.find().then(companies => {
                companies.forEach((com,i)=>{
                    admin.find({company:com._id}).then(admins => {
                        com = com.toJSON();
                        com.admins = [];
                        admins.forEach((admin,i)=>{
                            admin = admin.toJSON();
                            delete admin.password;
                            com.admins.push(admin);
                        });
                        response.companies.push(com);
                        resolve(response);
                    }).catch(err => {return res.status(500).json({message:"Internal Server Error"});});
                });
            }).catch(err => {return res.status(500).json({message:"Internal Server Error"});});
        })
        .then((resp) => {return res.status(200).send(resp)});
    }
    else 
        company.findOne({_id:req.params.id}).then(matchedCompany => {
            admin.find({company:matchedCompany._id}).then(admins => {
                return res.status(200).json({company:matchedCompany,admins});
            }).catch(err => {return res.status(500).json({message:"Internal Server Error"});});
        })
        .catch(err => {return res.status(500).json({message:"Internal Server Error"});});
});

router.post('/add',AuthController.verify_token,function(req,res){
    if(req.decoded.priority > 2) return res.status(403).json({message:"Unauthorized"});
    battalion.findOne({_id:ObjectId(req.body.battalion)}).then(matchedBattalion => {
        if(!matchedBattalion) return res.status(403).json({message:"Unauthorized"});
        else {
            if(!ObjectId.isValid(req.body.battalion)) return res.status(403).json({message:"Invalid Battalion"});
            let newCompany = new company({
                companyName:req.body.companyName,
                battalion:ObjectId(req.body.battalion)
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
                                    bcrypt.hash(req.body.adminPassword,10,function(err,hash){
                                        if(err) return res.status(500).json({message:"Internal Server Error"});
                                        else {
                                            companyResult.personnel.push(personnelResult._id);
                                            companyResult.save((err,result)=>{if(err) return res.status(500).json({message:"Internal Server Error"});});
                                            let newAdmin = new admin({
                                                username : req.body.adminUsername,
                                                password : hash,
                                                priority : 3,
                                                personnelInfo : personnelResult._id,
                                                battalion : req.body.battalion,
                                                company : companyResult._id,
                                                location : req.body.location
                                            });
        
                                            newAdmin.save((err,adminResult)=>{
                                                if(err) return res.status(500).json({message:"Internal Server Error"});
                                                else {
                                                    companyResult.personnel.push(adminResult._id);
                                                    companyResult.save((err,result) => {
                                                        if(err) return res.status(500).json({message:"Internal Server Error"});
                                                        return res.status(200).json({message:"Company Created"});
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
        return res.status(500).json({message:"Internal Server Error"});
    })
});

router.delete('/remove',AuthController.verify_token,function(req,res){
    if(req.decoded.priority > 2) return res.status(403).json({message:"Unauthorized"});
    company.deleteOne({_id:ObjectId(req.body.companyID)},(err,result)=>{
        if(err) return res.status(500).json({message:"Internal Server Error"});
        else return res.status(200).json({message:"Company Removed"});
    });
});

router.post('/admin/add',AuthController.verify_token,AuthController.is_authorized,function(req,res){
    if(req.decoded.priority > 2) return res.status(403).json({message:"Unauthorized"});
    bcrypt.hash(req.body.adminPassword,10,function(err,hash){
        if(err) return res.status(500).json({message:"Internal Server Error"});
        else {
            let newAdmin = new admin({
                username : req.body.adminUsername,
                password : hash,
                priority : 3,
                personnelInfo : req.body.personnelID,
                battalion : req.body.battalion,
                company : req.body.company
            });

            newAdmin.save((err,result)=>{
                console.log(err);
                if(err) return res.status(500).json({message:"Internal Server Error"});
                else return res.status(200).json({message:"Admin Added"});
            });
        }
    })
});

router.delete('/admin/remove',AuthController.verify_token,AuthController.is_authorized,function(req,res){
    if(req.decoded.priority > 2) return res.status(403).json({message:"Unauthorized"});
    admin.deleteOne({_id:ObjectId(req.body.adminID)},(err,result) => {
        if(err) return res.status(500).json({message:"Internal Server Error"});
        return res.status(200).json({message:"Admin Removed"});
    });
});

module.exports = router;