const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoose_delete = require('mongoose-delete');

const UserSchema = new Schema(
    {
        phone: {
            type: String,
            unique: true,
            required: true,
        },
        email: {
            type: String,
        },
        password: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

UserSchema.plugin(mongoose_delete);

module.exports = mongoose.model('User', UserSchema);
