const { sendBasicResponse } = require("../../helpers/response")
const { JobCategoryModel } = require("../../models/jobCategory")

exports.deleteJobCategory = async (req, res, next) => {
    try {
        const { id } = req.params

        if (!id) {
            throw new Error400Handler("An ID is required to delete a category")
        }


        const deletedCategory = await JobCategoryModel.findByIdAndDelete(id)

        sendBasicResponse(res, deletedCategory)
    } catch (error) {
        next(error)
    }
}