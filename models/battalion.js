const mongoose = require('mongoose');

const battalionSchema = new mongoose.Schema({
    battalionNumber : {
        type:String,
        unique:true,
        required:true
    },
    companies:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Company'
    }],
    admins:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Admin'
    }],
    location : {
        type : String
    }
});

module.exports = mongoose.model('Battalion',battalionSchema);