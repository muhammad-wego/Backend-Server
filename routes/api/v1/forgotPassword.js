const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
let admin = require('../../../models/admin');

let email = process.env['ADMIN_EMAIL'];
let password = process.env['ADMIN_PASSWORD'];

router.post('/',function(req,res){
    admin.findOne({username:req.body.username,priority:1},(err,matchedAdmin) => {
        if(err)
            return res.status(403).json({message: "Admin Not Found. Please Recheck Auth"});
        else {
            console.log(matchedAdmin);
            if(!matchedAdmin) return res.status(403).json({message : "Unauthorized"});
            if(!matchedAdmin.email)
                return res.status(401).json({message : "Email Not Configured. Please Contact Admin"});
            
            let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                requireTLS : true,
                auth: {
                    user: email,
                    pass : password
                }
            });
        
            let mailOptions = {
                from : email,
                to : matchedAdmin.email,
                subject : '[Important] Forgot Password KSRP Health Monitor',
                text : mailBody()
            };
        
            transporter.sendMail(mailOptions,function(err,info){
                if(err){
                    return res.status(500).json({message : "Oops! An Error Occured. Please try again later"});
                }
                else {
                    return res.status(200).json({message : "Email Sent. Please check mail"});
                }
            });
        
            function mailBody(){
                let otp = Math.floor(100000 + Math.random() * 900000);
                matchedAdmin.verification_code = otp;
                matchedAdmin.save((err,result) => {
                    if(err) return res.status(500).json({message : "Error Saving OTP"});
                    else console.log("Password Process : " + matchedAdmin.email);
                });
                return "OTP for KSRP Health Monitor is " + otp + "\nYou are receiving this as you have requested to change your Password, if you did not initiate this process. Please contact Admin Immedietly";
            }
        }
    });

});

router.post('/otp',function(req,res){
    admin.findOne({username:req.body.username}).then(matchedAdmin => {
        if(!matchedAdmin) return res.status(403).json({message : "Admin Not Found"});
        else {
            if(matchedAdmin.verification_code != req.body.verification_code) {
                let otp = Math.floor(100000 + Math.random() * 900000);
                matchedAdmin.verification_code = otp;
                matchedAdmin.save((err,result) => {
                    if(err) return res.status(500).json({message : "Error Verifying"});
                    else return res.status(401).json({message : "Unauthenticated Access"});
                });
            }
            else {
                bcrypt.hash(req.body.password,10,function(err,hash){
                    if(err) return res.status(401).json({message : "Admin Password Hashing Failed"});
                    else {
                        matchedAdmin.password = hash;
                        matchedAdmin.save((err,result) => {
                            if(err) return res.status(500).json({message : "Error Saving Password"});
                            else  {
                                let otp = Math.floor(100000 + Math.random() * 900000);
                                matchedAdmin.verification_code = otp;
                                matchedAdmin.save((err,result) => {
                                    if(err) console.log(err);
                                });
                                return res.status(200).json({message : "Password Updated"});
                            }
                        });
                    }
                });
            }
        }
    }).catch(err => {
        console.log("Error OTP : " + err);
        return res.status(500).json({message : "Internal Server Error"});
    });
});

module.exports = router;