const express = require('express');
const router = express.Router();
const battalion = require('../../../models/battalion');
const ObjectId = require('mongodb').ObjectId;
const AuthController = require('../../../contollers/AuthController');

router.post('/view/:id',AuthController.verify_token,function(req,res){
    if(req.params.id == 'all')
        battalion.find().then(battalions => {return res.status(200).json({battalions});})
        .catch(err => {return res.status(500).json({message:"Internal Server Error"});});
    else 
        battalion.findOne({_id:req.params.id}).then(matchedBattalion => {return res.status(200).json({battalion:matchedBattalion});})
        .catch(err => {return res.status(500).json({message:"Internal Server Error"});});
});

router.post('/add',AuthController.verify_token,function(req,res){
    let newBattalion = new battalion({
        battalionNumber : req.body.battalionNumber
    });

    newBattalion.save((err,result)=>{
        if(err) return res.status(500).json({message:"Internal Server Error"});
        else return res.status(200).json({message:"Battalion Saved"});
    });
});

router.delete('/remove',AuthController.verify_token,function(req,res){
    battalion.deleteOne({_id:ObjectId(req.body.battalionID)},(err,result)=>{
        if(err) return res.status(500).json({message:"Internal Server Error"});
        else return res.status(200).json({message:"Battalion Removed"});
    });
});

module.exports = router;