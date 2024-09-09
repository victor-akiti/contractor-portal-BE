const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    acceptedTermsAt: {
        type: Date,
        default: Date.now()
    },
    uid: {
        type: String
    },
    email: {
        type: String
    },
    phone: {

    },
    providerId: {
        type: String
    },
    name: {
        type: String
    },
    isAdmin: {
        type: Boolean
    },
    iseCnP: {
        type: Boolean
    },
    admin: {
        
    },
    role: {
        type: String,
        enum: ["User", "End User", "CO", "GM", "HOD", "GMD", "Insurance Officer", "Admin"],
        default: "User"
    },
    isSuspended: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

const UserModel = mongoose.model("User", Schema)

module.exports = {UserModel}