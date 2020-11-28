const mongoose = require('mongoose');

const personnelHealthSchema = new mongoose.Schema({
    personnel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Personnel'
    },
    height : {
        type : Number,
        required : true
    },
    weight : {
        type : Number,
        required : true
    },
    bmi : {
        type : Number,
        required : true
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
    },
    score:{
        type:Number
    }
});

module.exports = mongoose.model('PersonnelHealth',personnelHealthSchema);