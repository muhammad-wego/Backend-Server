const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    companyName : {
        type:String,
        unique:true,
        required:true
    },
    battalion :{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Battalion'
    },
    personnel:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Personnel'
    }]
});

exports.Company = mongoose.model('Company',companySchema);