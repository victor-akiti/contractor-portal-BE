const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    fname: {
        type: String
    },
    lname: {
        type: String
    },
    uid: {
        type: String
    },
    phone: {

    },
    timeApproved: {

    },
    companyName: {
        type: String,
        index: true
    },
    name: {
        type: String
    },
    expiry: {

    },
    user: {

    },
    email: {
        type: String
    },
    hash: {
        type: String
    },
    token: {
        type: String
    },
    approved: {
        type: Boolean
    },
    used: {
        type: Number
    },
    inviteHistory: {
        type: Array,
        required: true,
        default: []
    },
    lastReminderSent: {
        type: Date
    }

}, {timestamps: true})


const Invite = mongoose.model("Invite", Schema)



module.exports = {
    Invite
}