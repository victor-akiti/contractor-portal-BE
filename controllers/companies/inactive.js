const { admin } = require("../../auth/initializeFirebase")
const { Error400Handler } = require("../../errorHandling/errorHandlers")
const { sendBasicResponse } = require("../../helpers/response")
const { Company } = require("../../models/company")
const { InactiveVendorModel } = require("../../models/inactiveVendor")
const { Invite } = require("../../models/invite")
const { UserModel } = require("../../models/user")
const { VendorModel } = require("../../models/vendor")

exports.makeVendorInactive = async (req, res, next) => {
    try {
        const {companyID} = req.params


        const vendorCompany = await Company.findOne({_id: companyID})

        if (!vendorCompany) {
            throw new Error404Handler("The vendor account you're trying to make inactive does not exist.")
        }

        const vendorForm = await VendorModel.findOne({_id: vendorCompany.vendor})

        const vendorAdmin = await UserModel.findOne({uid: vendorCompany.userID})

        let vendorInvite = {}

        if (vendorCompany.contractorDetails) {
            vendorInvite = await Invite.findOne({email: vendorCompany?.contractorDetails?.email})
        }

        let inactiveVendorDetails = {}

        if (vendorCompany) {
            inactiveVendorDetails["company"] = vendorCompany
            inactiveVendorDetails["companyName"] = vendorCompany.companyName
        }

        if (vendorForm) {
            inactiveVendorDetails["form"] = vendorForm
        }

        if (vendorAdmin) {
            inactiveVendorDetails["portalAdmin"] = vendorAdmin
        }

        if (vendorInvite) {
            inactiveVendorDetails["invite"] = vendorInvite
        }

        //Create new inactive vendor record
        const newInactiveVendor = new InactiveVendorModel(inactiveVendorDetails)
        const savedNewInactiveVendor = await newInactiveVendor.save()

        //Remove former administrator and delete their firebase account
        const deletedFirebaseUser = await admin.auth().deleteUser(vendorAdmin.uid)
        
        //Delete vendor user, company and form records

        if (vendorCompany) {
            await Company.findOneAndDelete({_id: vendorCompany._id})
        }

        if (vendorForm) {
            await VendorModel.findOneAndDelete({_id: vendorForm._id})
        }

        if (vendorAdmin) {
            await UserModel.findOneAndDelete({_id: vendorAdmin._id})
        }

        if (vendorInvite) {
            await Invite.findOneAndDelete({_id: vendorInvite._id})
        }
        

        sendBasicResponse(res, {})
    } catch (error) {
        next(error)
    }
}