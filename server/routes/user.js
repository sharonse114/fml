var mongoose = require('mongoose');
//var Schema = mongoose.Schema;
var userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
      firstName: {
        type: String,
        required: true,
        trim: true
      },
      lastName: {
        type: String,
        required: true,
        trim: true
      },
    },
    userName: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    created: { 
        type: Date,
        default: Date.now
    }
  });

 
var User = mongoose.model('User', userSchema);
 
module.exports = User;