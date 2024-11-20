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
        enum: ["User", "End User", "VRM", "C and P Staff", "CO", "GM", "Supervisor", "Executive Approver", "HOD", "Insurance Officer", "Admin", "C&P Admin"],
        // [Supervisor, Executive Approver, ]
        default: "User"
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    department: {
        type: String
    }
}, {timestamps: true})

const UserModel = mongoose.model("User", Schema)

module.exports = {UserModel}