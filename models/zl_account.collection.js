const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');

const ZlAccountSchema = new Schema(
    {
        user: {
            type: mongoose.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        cookies: {
            type: String,
            required: true,
        },
        inUse: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

ZlAccountSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('ZlAccount', ZlAccountSchema);
