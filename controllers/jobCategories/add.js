const { sendBasicResponse } = require("../../helpers/response");
const { JobCategoryModel } = require("../../models/jobCategory");

exports.addJobCategory = async (req, res, next) => {
    try {
        console.log(req.body);
        if (req.body.category === "") {
            next(new Error400Handler("Category cannot be empty"))
        }

        const newJobCategory = new JobCategoryModel({
            category: req.body.label,
            userID: req.user._id,
            userName: req.user.name
        })

        const savedCategory = await newJobCategory.save()

        console.log({savedCategory});

        sendBasicResponse(res, savedCategory)
        


        
    } catch (error) {
        next(error)
    }
}