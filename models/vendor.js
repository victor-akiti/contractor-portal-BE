const mongoose = require("mongoose")
const { UserModel } = require("./user")

const Schema = new mongoose.Schema({
    form: {
        type: Object,
        required: true
    },
    vendorAppAdminUID: {
        type: String,
        required: true
    },
    vendorAppAdminProfile: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: UserModel
    },
    modificationHistory: {
        type: Array
    },
    companyType: {
        type: String,
        enum: ["Standalone", "Parent", "Subsidiary"],
        default: "Standalone"
    },
    associatedCompany: {
        type: mongoose.Types.ObjectId,
        ref: "Vendor"
    }
}, {timestamps: true})

const VendorModel = mongoose.model("Vendor", Schema)

module.exports = {
    VendorModel
}