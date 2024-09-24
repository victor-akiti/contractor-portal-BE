const { sendBasicResponse } = require("../../helpers/response")
const { JobCategoryModel } = require("../../models/jobCategory")

exports.getAllJobCategories = async (req, res, next) => {
    try {
        const jobCategories = await JobCategoryModel.find()

        //Sort results alphabetically

        jobCategories.sort((a, b) => {
            if (a.category < b.category) {
                return -1
            }
            if (a.category > b.category) {
                return 1
            }
            return 0
        })

        sendBasicResponse(res, jobCategories)
    } catch (error) {
        next(error)
    }
}