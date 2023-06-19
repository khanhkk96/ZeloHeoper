const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const { ScheduleStatus } = require('../common/constants');

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
        file: {
            type: String,
        },
        phoneNumber: {
            type: String,
        },
        partVolume: {
            type: Number,
            default: 500,
        },
        sentTo: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enums: [ScheduleStatus.PENDING, ScheduleStatus.SENT],
            default: ScheduleStatus.PENDING,
        },
        isProcessing: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

ScheduleSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('schedules', ScheduleSchema);
