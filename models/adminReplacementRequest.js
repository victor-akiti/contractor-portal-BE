const mongoose = require("mongoose")
const { VendorModel } = require("./vendor")
const { UserModel } = require("./user")

const Schema = new mongoose.Schema({
    email: {
        type: String
    },
    expiry: {
        type: Date
    },
    hash: {
        type: String
    },
    vendor: {
        type: mongoose.Types.ObjectId,
        ref: VendorModel
    },
    requestedBy: {
        type: String
    },
    used: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

const AdminReplacementRequestModel = mongoose.model("AdminReplacementRequest", Schema)

module.exports = {
    AdminReplacementRequestModel
}