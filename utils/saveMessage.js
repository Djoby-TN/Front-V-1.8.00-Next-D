const { Conversation } = require('../models/models');
const mongoose = require('mongoose');


const saveMessage = async (message) => {
    const { from, to, content } = message;

    let conversation = await Conversation.findOne({
        participants: { $all: [new mongoose.Types.ObjectId(from), new mongoose.Types.ObjectId(to)] }
    });

    if (!conversation) {
        conversation = new Conversation({
            participants: [ new mongoose.Types.ObjectId(from), new mongoose.Types.ObjectId(to)],
            messages: [],
        });
    }

    conversation.messages.push({
        content,
        from: new mongoose.Types.ObjectId(from),
        to: new mongoose.Types.ObjectId(to),
    });

    await conversation.save();
};


module.exports = saveMessage;
