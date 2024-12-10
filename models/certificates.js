const mongoose = require("mongoose")
const { VendorModel } = require("./vendor")
const { UserModel } = require("./user")
const { Company } = require("./company")

const Schema = new mongoose.Schema({
    url: {
        type: String
    },
    issueDate: {
        type: Date
    },
    expiryDate: {
        type: Date
    },
    label: {
        type: String
    },
    name: {
        type: String
    },
    vendor: {
        type: mongoose.Types.ObjectId,
        ref: VendorModel
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: UserModel
    },
    updateCode: {
        type: String
    },
    trackingStatus: {
        type: String,
        default: "tracked"
    },
    company: {
        type: mongoose.Types.ObjectId,
        ref: Company
    }
}, {timestamps: true})

const CertificateModel = mongoose.model("Certificate", Schema)

module.exports = {
    CertificateModel
}