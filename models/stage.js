const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
    stageName : {
        type:String
    },
    healthParameter:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'HealthParameter'
    }
});

exports.Stage = mongoose.model('Stage',stageSchema);