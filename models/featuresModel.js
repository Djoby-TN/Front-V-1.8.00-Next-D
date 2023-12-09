const mongoose = require('mongoose');

const EmergencyFeatureSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        },
    stauts: String,
    createdDate: {
        type: Date,
        default: Date.now,
        },
    });

const EmergencyFeature = mongoose.model('EmergencyFeature', EmergencyFeatureSchema);

module.exports = {EmergencyFeature, };