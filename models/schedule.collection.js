const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoose_delete = require('mongoose-delete');

const ScheduleSchema = new Schema(
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
        time: {
            type: Date,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        partVolume: {
            type: Number,
        },
    },
    { timestamps: true },
);

ScheduleSchema.plugin(mongoose_delete);

module.exports = mongoose.model('schedules', ScheduleSchema);
