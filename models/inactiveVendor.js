const mongoose = require("mongoose")
const { VendorModel } = require("./vendor")
const { UserModel } = require("./user")

const Schema = new mongoose.Schema({
    company: {

    },
    form : {

    },
    portalAdmin: {

    },
    invite: {

    },
    companyName: {
        type: String
    }
}, {timestamps: true})

const InactiveVendorModel = mongoose.model("InactiveVendor", Schema)

module.exports = {
    InactiveVendorModel
}