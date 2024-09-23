const mongoose = require("mongoose")
const { VendorModel } = require("./vendor")
const { UserModel } = require("./user")

const Schema = new mongoose.Schema({
    category: {
        type: String
    },
    userID: {
        type: String
    },
    userName: {
        type: String
    }
}, {timestamps: true})

const JobCategoryModel = mongoose.model("JobCategory", Schema)

module.exports = {
    JobCategoryModel
}