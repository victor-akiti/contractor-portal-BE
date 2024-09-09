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
    }

}, {timestamps: true})


const ArchivedInvite = mongoose.model("ArchivedInvite", Schema)



module.exports = {
    ArchivedInvite
}