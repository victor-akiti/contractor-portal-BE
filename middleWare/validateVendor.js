const { Error404Handler } = require("../errorHandling/errorHandlers")
const { Company } = require("../models/company")
const { VendorModel } = require("../models/vendor")
const mongoose = require("mongoose")

const validateVendor = async (req, res, next) => {
    try {
        const {vendorID} = req.params

        if (!vendorID) {
            throw new Error400Handler("A vendor ID is reqired to complete this action")
        }

        const company = await Company.findOne({_id: vendorID})

        console.log({company});
        

        const vendor = await VendorModel.findOne({_id: company.vendor})

        
        
        if (!vendor || !company) {
            throw new Error404Handler("The vendor account you're trying to view or update does not exist.")
        }

        req.vendor = vendor
        req.company = company

        next()
    } catch (error) {
        next(error)
    }
}

module.exports = {
    validateVendor
}