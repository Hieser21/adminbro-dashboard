import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    subscription: {
        required: false,
        type: String,
        enum: ['lite', 'pro']
    },
    isActive: {
        required: false,
        type: String,
        enum: ['Active', 'Offline']
    },
    encryptedPassword: {
        type: String,
        required: true
    },
    userid: { type: String },
    role: { type: String, enum: ['Owner', 'Developer'], required: true },
    placeid: { type: String, required: true },
    theme: { type: String, required: true },
    photoname: { type: String },
    mime: { type: String },
    avatar: { type: String },
}, {
    timestamps: true
});
const Users = mongoose.model('Users', UserSchema);
export default Users;
