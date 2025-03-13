const { Error400Handler, Error404Handler } = require("../../errorHandling/errorHandlers")
const { newPortalAdminRequestTemplate } = require("../../helpers/emailTemplates")
const { sendMail } = require("../../helpers/mailer")
const { sendBasicResponse } = require("../../helpers/response")
const { AdminReplacementRequestModel } = require("../../models/adminReplacementRequest")
const { Company } = require("../../models/company")
const { UserModel } = require("../../models/user")

exports.getAllSettings = async (req, res, next) => {
    try {
        
    } catch (error) {
        next(error)
    }
}

exports.updatePortalAdministratorProfile = async (req, res, next) => {
    try {
        //Check if vendor records exist. If they don't return an error
        const vendorID = req.params.vendorID

        if (!vendorID) {
            throw new Error400Handler("Vendor ID is required")
        }

        const company = await Company.findOne({_id: vendorID})

        if (!company) {
            throw new Error404Handler("Company not found")
        }

        const adminProfile = await UserModel.findOne({_id: company.vendorAppAdminProfile})

        const {name, email, phone} = req.body

        if (name) {
            adminProfile.name = name
        }

        if (phone) {
            adminProfile.phone = phone
        }

        const updatedAdminProfile = await adminProfile.save()

        sendBasicResponse(res,  updatedAdminProfile)
        
        
        
    } catch (error) {
        next(error)
    }
}

exports.requestNewPortalAdministrator = async (req, res, next) => {
    try {
        const {vendorID} = req.params

        console.log({vendorID});
        

        const {email} = req.body

        console.log({vendorID, email});
        
        

        if (!vendorID) {
            throw new Error400Handler("Vendor ID is required")
        }

        const company = await Company.findOne({_id: vendorID})

        if (!company) {
            throw new Error404Handler("Company not found")
        }

        //Check if any user exists with this email
        const user = await UserModel.findOne({email})

        console.log({user});

        if (user) {
            throw new Error400Handler("This email address is already in use. Please use a different email address.")
        }

        //Check if a request already exists for this user
        const existingRequest = await AdminReplacementRequestModel.findOne({email, used: false})

        if (existingRequest) {
            throw new Error400Handler("A request for this email address already exists.")
        }

        //check if there are any unused requests for this company
        const existingRequests = await AdminReplacementRequestModel.findOne({vendor: company._id, used: false})

        //if any requests exist, mark them as used
        if (existingRequests) {
            await AdminReplacementRequestModel.updateMany({vendor: company._id, used: false}, {used: true})
        }

        const newRequest = new AdminReplacementRequestModel({
            email,
            vendor: company._id,
            requestedBy: req.user.name,
            expiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
            hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        })
        

        const savedRequest = await newRequest.save()

        if (savedRequest) {
            sendBasicResponse(res, savedRequest)
        }

        //Send email to prospective admin informing them that they have been nominated


            const sendNewPortalAdminEmail = await sendMail({
                to: email,
                cc: "",
                bcc: "",
                subject: "Amni New Portal Administrator Link",
                html: newPortalAdminRequestTemplate({companyName: company.companyName, hash: savedRequest.hash}).html,
                text: newPortalAdminRequestTemplate({companyName: company.companyName, hash: savedRequest.hash}).text
            })
    
            if (sendNewPortalAdminEmail[0].statusCode === 202 || sendNewPortalAdminEmail[0].statusCode === "202") {
                //Create event
                console.log("Email sent");
                
            }

        
        
    } catch (error) {
        next(error)
    }
}

exports.registerNewPortalAdministrator = async (req, res, next) => {
    try {
        
    } catch (error) {
        next(error)
    }
}