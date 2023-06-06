const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoose_delete = require('mongoose-delete');

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
    },
    { timestamps: true },
);

ZlAccountSchema.plugin(mongoose_delete);

module.exports = mongoose.model('ZlAccount', ZlAccountSchema);
