const mongoose = require("mongoose")
const { VendorModel } = require("./vendor")
const { UserModel } = require("./user")
const { Company } = require("./company")

const Schema = new mongoose.Schema({
    vendorID: {
        type: mongoose.Types.ObjectId,
        ref: Company
    },
    vendorName: {

    },
    userID: {
        type: mongoose.Types.ObjectId,
        ref: UserModel
    },
    userName: {

    },
    userRole: {

    },
    eventIndex : {

    },
    eventName: {

    },
    eventID: {

    },
    extraData: {
        
    },
    eventDescription: {
        type: String,
        required: true
    },
    type: {
        enum: ["updated certificate", "archived invite", "invite sent", "resent invite", "renewed invite", "registered", "login", "processed", "approved", "revert", "approved hold request", "assigned role", "return", "submitted", "updated certificate", "requested hold", "placed on hold", "other", "returned to previous stage"]
    }
}, {timestamps: true})

const EventModel = mongoose.model("Event", Schema)

module.exports = {
    EventModel
}