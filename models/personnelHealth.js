const mongoose = require('mongoose');

const personnelHealthSchema = new mongoose.Schema({
    personnel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Personnel'
    },
    parameters:
        [{
            healthParameter:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'HealthParameter'
            },
            stage:{
                type:String
            },
            value:{
                type:Number
            },
            presence:{
                type:Boolean
            }
        }],
    dateOfEntry:{
        type:Date
    }
});

module.exports = mongoose.model('PersonnelHealth',personnelHealthSchema);