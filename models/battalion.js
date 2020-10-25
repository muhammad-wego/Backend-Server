const mongoose = require('mongoose');

const battalionSchema = new mongoose.Schema({
    battalionNumber : {
        type:Number,
        unique:true,
        required:true
    },
    companies:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Company'
    }]
});

exports.Battalion = mongoose.model('Battalion',battalionSchema);