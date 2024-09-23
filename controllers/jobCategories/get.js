const { sendBasicResponse } = require("../../helpers/response")
const { JobCategoryModel } = require("../../models/jobCategory")

exports.getAllJobCategories = async (req, res, next) => {
    try {
        const jobCategories = await JobCategoryModel.find()
        sendBasicResponse(res, jobCategories)
    } catch (error) {
        next(error)
    }
}