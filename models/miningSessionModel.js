const mongoose = require('mongoose');

const miningSessionSchema = new mongoose.Schema({
    sessionId :{
        type:String,  // needed to identify each anonymous session
        required:true,
        unique:true
    },
    startAt:{
        type:Date,
        default:Date.now},
    boostType: {
    type: String,
    enum: ['watch_ads', 'pay_fee'],
    default: null
  },
   boostedAt:{
    type:Date,
    default:null
},
  ended: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('MiningSessionModel',miningSessionSchema )