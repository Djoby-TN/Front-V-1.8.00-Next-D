const mongoose = require('mongoose');

const requestPhoneNumberSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  isGuest: {
    type: Boolean,
    default: false
  }
});

const requestPhoneNumber = mongoose.model('request-phoneNumber',  requestPhoneNumberSchema);

module.exports = {requestPhoneNumber};
