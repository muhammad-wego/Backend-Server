const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;
const admin = require('../../../models/admin');

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
                else res.status(200).json({message:"Registration Successfully"});
            });
        }
    });
});

module.exports = router;