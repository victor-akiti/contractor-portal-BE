const mongoose = require("mongoose")
const { VendorModel } = require("./vendor")
const { Company } = require("./company")

const Schema = new mongoose.Schema({
    action: {
        type: String,
        enum: ["Submitted Application", "Re-Submitted Application", "Updated Certificate", "Registered Account"]
    },
    user: {
        type: String
    },
    vendor: {
        type: mongoose.Types.ObjectId,
        ref: VendorModel
    },
    company: {
        type: mongoose.Types.ObjectId,
        ref: Company
    },
    companyName: {
        type: String
    }
}, {timestamps: true})

const NotificationModel = mongoose.model("Notification", Schema)

module.exports = {
    NotificationModel
}