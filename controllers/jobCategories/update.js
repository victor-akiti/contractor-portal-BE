const { sendBasicResponse } = require("../../helpers/response")
const { JobCategoryModel } = require("../../models/jobCategory")

exports.updateJobCategory = async (req, res, next) => {
    try {
        const { id } = req.params

        if (!id) {
            throw new Error400Handler("An ID is required to update a category")
        }

        const { category } = req.body

        console.log({id, category});
        

        if (!category) {
            throw new Error400Handler("Category cannot be empty")
        }


        const updatedCategory = await JobCategoryModel.findByIdAndUpdate(id, {
            category
        })

        sendBasicResponse(res, {
           category})
    } catch (error) {
        next(error)
    }
}