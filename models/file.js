const mongoose = require("mongoose")
const { VendorModel } = require("./vendor")
const { UserModel } = require("./user")

const Schema = new mongoose.Schema({
    companyUID: {
        type: mongoose.Types.ObjectId,
        ref: VendorModel
    },
    downloadURL: {

    },
    label: {

    },
    name: {

    },
    path: {

    },
    timestamp : {

    },
    type: {

    },
    userID: {

    },
    secureDownloadURL: {

    },
    updateCode: {
        type: String
    }
}, {timestamps: true})

const FileModel = mongoose.model("File", Schema)

module.exports = {
    FileModel
}