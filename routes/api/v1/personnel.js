const express = require('express');
const router = express.Router();
const personnel = require('../../../models/personnel');
const company = require('../../../models/company');
const ObjectId = require('mongodb').ObjectId;
const AuthController = require('../../../contollers/AuthController');

router.post('/add',AuthController.verify_token,function(req,res){
    company.findOne({_id:ObjectId(req.body.companyID)}).then(matchedCompany => {
        if(!matchedCompany) return res.status(403).json({message:"Unauthorized"});
        else {
            let newPersonnel = new personnel({
                personnelName : req.body.personnelName,
                company : req.body.companyID,
                rank : req.body.rank,
                metalNo : req.body.metalNo,
                dateOfBirth : req.body.dateOfBirth,
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

module.exports = router;