const mongoose = require('mongoose');
const { ActionResult, ActionType } = require('../common/constants');
const Schema = mongoose.Schema;

const HistorySchema = new Schema(
    {
        user: {
            type: mongoose.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        account: {
            type: mongoose.Types.ObjectId,
            required: true,
            ref: 'ZlAccount',
        },
        actionType: {
            type: String,
            require: true,
            enum: [ActionType.INVITATION, ActionType.SENDING],
        },
        phone: {
            type: String,
            required: true,
        },
        message: {
            type: String,
        },
        result: {
            type: String,
            enum: [ActionResult.SUCCESS, ActionResult.FAILURE],
            default: ActionResult.SUCCESS,
        },
        note: {
            type: String,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('History', HistorySchema);
