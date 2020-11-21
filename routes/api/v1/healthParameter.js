const express = require('express');
const router = express.Router();
const healthParameter = require('../../../models/healthParameter');
const ObjectId = require('mongodb').ObjectId;
const AuthController = require('../../../contollers/AuthController');

router.post('/view',AuthController.verify_token,function(req,res){
    healthParameter.find().then(params => {return res.status(200).json({params});})
    .catch(err=>{return res.status(500).json({message:"Internal Server Error"});});
});

router.post('/add',AuthController.verify_token,function(req,res){
    let newHealthParams = new healthParameter({
        name : req.body.paramName,
        type : req.body.paramType,
        lowerRange : req.body.lowerRange,
        upperRange : req.body.upperRange,
        normalPresence : req.body.normalPresence
    });

    newHealthParams.stages.push(req.body.stages);

    newHealthParams.save((err,result) => {
        if(err) return res.status(500).json({message:"Internal Server Error"});
        return res.status(200).json({message:"Health Parameter Added"});
    });
});

router.delete('/remove',AuthController.verify_token,function(req,res){
    healthParameter.deleteOne({_id:ObjectId(req.body.healthParamID)},(err,result)=>{
        if(err) return res.status(500).json({message:"Internal Server Error"});
        return res.status(200).json({message:"Health Parameter Removed"});
    });
});

module.exports = router;