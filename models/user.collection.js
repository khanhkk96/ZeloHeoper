const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const bcrypt = require('bcrypt');

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
        isBlocked: { type: Boolean, default: false },
        level: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user',
        },
    },
    {
        timestamps: true,
        methods: {
            comparePassword(password) {
                return bcrypt.compare(password, this.password); // return a promise has result true or false abc@123
            },
        },
    },
);

UserSchema.plugin(softDeletePlugin);

UserSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('password')) {
        console.log('New password: ', this.password);
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = mongoose.model('User', UserSchema, 'users');
