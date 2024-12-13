const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    acceptedTermsAt: {

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
    isCnP: {
        type: Boolean
    },
    admin: {
        
    },
    
    role: {
        type: String,
        enum: ["Vendor", "Amni Staff", "End User", "VRM", "C and P Staff", "Supervisor", "Executive Approver", "HOD", "Insurance Officer", "Admin", "C&P Admin"],
        // [Supervisor, Executive Approver, ]
        default: "Vendor"
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    department: {
        type: String
    },
    substituting: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    outOfOffice: {
        type: Object
    },
    tempRole: {
        type: String,
        enum: ["Vendor", "Amni Staff", "VRM", "C and P Staff", "CO", "GM", "Supervisor", "Executive Approver", "HOD", "Insurance Officer", "Admin", "C&P Admin"]
    }
}, {timestamps: true})

const UserModel = mongoose.model("User", Schema)

module.exports = {UserModel}