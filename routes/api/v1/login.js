const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const admin = require('../../../models/admin');
const JWT_SECRET = process.env['JWT_SECRET'];

const AuthController = require('../../../contollers/AuthController');

router.post('/',AuthController._sign_in_checks,function(req,res){
    admin.findOne({username:req.body.username}).then(matchedAdmin => {
        if(!matchedAdmin) return res.status(401).json({message:"Authentication Failed"});
        else {
            bcrypt.compare(req.body.password,matchedAdmin.password,function(err,result){
                if(err) return res.status(500).json({message:"Internal Server Error"});
                else {
                    if(result){
                        let token = jwt.sign({username:matchedAdmin.username},JWT_SECRET,{expiresIn:8000});
                        return res.status(200).json({token});
                    }
                    else return res.status(401).json({message:"Authentication Failed"});
                }
            });
        }
    }).catch(err => {
        console.log("Error Fetching Admin : " + err);
        return res.status(500).json({message:"Internal Server Error"});
    });
});

module.exports = router;