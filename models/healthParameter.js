const mongoose = require('mongoose');

const healthParameterSchema = new mongoose.Schema({
    name:{
        type:String
    },
    type:{
        type:String
    },
    lowerRange:{
        type:Number
    },
    upperRange:{
        type:Number
    },
    normalPresence:{
        type:Boolean
    },
    stages:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Stage'
    }]
});

module.exports = mongoose.model('HealthParameter',healthParameterSchema);