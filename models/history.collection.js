const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoose_delete = require('mongoose-delete');

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
            enum: ['INVITING', 'SENDING'],
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
            enum: ['SUCCESS', 'FAILURE'],
            default: 'SUCCESS',
        },
    },
    { timestamps: true },
);

HistorySchema.plugin(mongoose_delete);

module.exports = mongoose.model('History', HistorySchema);
