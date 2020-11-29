const express = require('express');
const router = express.Router();
const record = require('../../../models/personnelHealth');
const ObjectId = require('mongodb').ObjectId;
const AuthController = require('../../../contollers/AuthController');

router.post('/:type/:healthParam/:query',AuthController.verify_token,AuthController.is_authorized,function(req,res){
    record.find({parameters:{$elemMatch:{healthParameter:ObjectId(req.params.healthParam)}}}).then(records => {
        let response = [];
        records.forEach((currentRecord,i) => {
            if(currentRecord.parameters[req.params.type] == req.params.query)
                response.push(currentRecord);
        });
        return res.status(200).json({records:response});
    }).catch(err => {
        return res.status(500).json({message : "Internal Server Error"});
    })
});

module.exports = router;