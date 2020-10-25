const mongoose = require('mongoose');

const personnelHealthSchema = new mongoose.Schema({
    personnel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Personnel'
    },
    healthParameter:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'HealthParameter'
    },
    stage:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Stage'
    },
    value:{
        type:Number
    },
    presence:{
        type:Boolean
    },
    dateOfEntry:{
        type:Date
    }
});

exports.PersonnelHealth = mongoose.model('PersonnelHealth',personnelHealthSchema);