const mongoose = require("mongoose")
const { VendorModel } = require("./vendor")
const { UserModel } = require("./user")

const Schema = new mongoose.Schema({
    vendorID: {
        type: mongoose.Types.ObjectId,
        ref: VendorModel
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
        
    }
}, {timestamps: true})

const EventModel = mongoose.model("Event", Schema)

module.exports = {
    EventModel
}