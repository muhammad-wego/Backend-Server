const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;
const admin = require('../../../models/admin');

const AuthController = require('../../../contollers/AuthController');

router.post('/',function(req,res){
    bcrypt.hash(req.body.password,10,function(err,hash){
        if(err) res.status(500).json({ message : "Registration Failed"});
        else {
            if(!ObjectId.isValid(req.body.personnelID)) return res.status(401).json({message:"Invalid Personnel ID"});
            let newAdmin = new admin ({
                username : req.body.username,
                password : hash,
                personnelID : ObjectId(req.body.personnelID),
                priority : req.body.priority
            });

            newAdmin.save((err,result)=>{
                if(err) res.status(500).json({message:"Registration Failed"});
                else res.status(200).json({message:"Registration Successfull"});
            });
        }
    });
});

router.post('/updatePassword',AuthController.verify_token,function(req,res){    
    if(req.decoded.priority < 2) {
        admin.findOne({_id:req.body.adminID}).then(matchedAdmin => {
            if(!matchedAdmin) return res.status(403).json({message : "Admin Not Found"});
            else {
                bcrypt.hash(req.body.newPassword,10,function(err,hash){
                    if(err) res.status(500).json({message : "Password Hashing Failed"});
                    else {
                        matchedAdmin.password = hash;

                        matchedAdmin.save((err,result) => {
                            if(err) return res.status(500).json({message : "Error Saving Admin to Database"});
                            else return res.status(200).json({message : "Admin Password Saved"});
                        });
                    }
                });
            }
        })
        .catch(err => {
            return res.status(500).json({message : "Password Updation Failed"});
        })
    } 
    else {
        admin.findOne({username:req.decoded.username}).then(matchedAdmin => {
            if(!matchedAdmin) return res.status(401).json({message : "Authentication Failed"});
            else {
                bcrypt.compare(req.body.password,matchedAdmin.password,function(err,result){
                    if(err) return res.status(500).json({message : "Error Comparing Hashes"});
                    else {
                        if(result) {
                            bcrypt.hash(req.body.newPassword,10,function(_err,hash) {
                                if(_err) return res.status(500).json({message : "Error Hashing Password"});
                                else {
                                    matchedAdmin.password = hash;

                                    matchedAdmin.save((saveErr,result) => {
                                        if(saveErr) return res.status(500).json({message : "Error Saving Admin Details"});
                                        else return res.status(200).json({message : "Admin Password Updated"});
                                    })
                                }
                            });
                        }
                    }
                });
            }
        }).catch(err => {
            return res.status(500).json({message : "Error Fetching Admins"});
        });
    }
});

module.exports = router;