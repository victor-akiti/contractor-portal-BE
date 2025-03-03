const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    
    name: {
        type: String
    },
    email: {
        type: String
    },
    companies: {
        type: Array,
        default: []
    },
    uid: {
        type: String
    },
    userID: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    role: {
        type: String,
        enum: ["Vendor", "Amni Staff", "End User", "VRM", "C and P Staff", "Supervisor", "Executive Approver", "HOD", "Insurance Officer", "Admin", "C&P Admin", "IT Admin"],
        // [Supervisor, Executive Approver, ]
        default: "Vendor"
    },
    department: {
        type: String
    },

}, {timestamps: true})

const UserSignInLogModel = mongoose.model("UserSignInLog", Schema)

module.exports = {UserSignInLogModel}