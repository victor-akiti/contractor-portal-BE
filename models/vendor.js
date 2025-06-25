const mongoose = require("mongoose")
const { UserModel } = require("./user")
const { Company } = require("./company")

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
    },
    company: {
        type: mongoose.Types.ObjectId,
        ref: Company
    },
    updated: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

const VendorModel = mongoose.model("Vendor", Schema)

module.exports = {
    VendorModel
}