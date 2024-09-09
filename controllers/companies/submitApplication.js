const { Error400Handler } = require("../../errorHandling/errorHandlers");
const { sendBasicResponse } = require("../../helpers/response");
const { Company } = require("../../models/company");

exports.submitApplication = async (req, res, next) => {
    try {
        const user = req.user
        const {vendorID} = req.body

        if (!vendorID) {
            throw new Error400Handler("You need to supply a vendor ID to complete this action.")
        } else {
            // Check if vendor application exists
            const vendorApplication = await Company.findOne({vendor: vendorID})

            if (vendorApplication) {
                const updatedVendorApplication = await Company.findOneAndUpdate({_id: vendorApplication._id}, {
                    flags: {...vendorApplication.flags, submitted: true, status: "pending", stage: "submitted"}
                })

                if (updatedVendorApplication) {
                    sendBasicResponse(res, {})
                }

                console.log({updatedVendorApplication});
            }

        }


        
    } catch (error) {
        next(error)
    }
}