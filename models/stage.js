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

module.exports = mongoose.model('Stage',stageSchema);