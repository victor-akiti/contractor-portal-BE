const { Error500Handler } = require("../../errorHandling/errorHandlers");
const { sendBasicResponse } = require("../../helpers/response");
const { Company } = require("../../models/company")

exports.updateCompanyJobCategoriesList = async (req, res, next) => {
    try {
        const { id } = req.params
        const { categories } = req.body

        if (!id) {
            throw new Error400Handler("An ID is required to update a company")
        }
        if (!categories) {
            throw new Error400Handler("Categories cannot be empty")
        }

        const vendorRecord = await Company.findOneAndUpdate({vendor: id}, {jobCategories: categories}, {new: true})

        console.log({vendorRecord});
        

        if (vendorRecord) {
            sendBasicResponse(res, vendorRecord.jobCategories)
        } else {
            throw new Error500Handler("Could not update the categories. Please try again later or contact the site administrator.")
        }
        
        

        // const updatedCompany = await Company.findByIdAndUpdate({_id: id}, {
        //     jobCategories: {$push: categories}
        // })
        // sendBasicResponse(res, {
        //     categories
        // })

    } catch (error) {
        next(error)
    }
}

exports.deleteCategoryFromVendorCategoryList = async (req, res, next) => {
    try {
        const { id } = req.params
        const { category } = req.body
        if (!id) {
            throw new Error400Handler("An ID is required to update a company")
        }
        if (!category) {
            throw new Error400Handler("Category cannot be empty")
        }
        const vendorRecord = await Company.findOneAndUpdate({vendor: id}, {$pull: {jobCategories: category}}, {new: true})

        if (vendorRecord) {
            sendBasicResponse(res, vendorRecord.jobCategories)
        } else {
            throw new Error500Handler("Could not update the categories. Please try again later or contact the site administrator.")
        }
    } catch (error) {
        next(error)
    }
}