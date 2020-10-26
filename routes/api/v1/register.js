const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;
const admin = require('../../../models/admin');

router.post('/',function(req,res){
    bcrypt.hash(req.body.password,10,function(err,hash){
        if(err) res.status(500).json({ msg : "Registration Failed"});
        else {
            let newAdmin = new admin ({
                username : req.body.username,
                password : hash,
                personnelID : ObjectId(req.body.personnelID)
            });

            console.log(hash);

            newAdmin.save((err,result)=>{
                if(err) res.status(500).json({msg:"Registration Failed"});
                else res.status(200).json({msg:"Registration Successfully"});
            });
        }
    });
});

module.exports = router;