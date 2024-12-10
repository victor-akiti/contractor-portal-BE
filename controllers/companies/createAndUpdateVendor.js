
const { Error400Handler, Error403Handler, Error500Handler } = require("../../errorHandling/errorHandlers");
const { sendBasicResponse } = require("../../helpers/response");
const { CertificateModel } = require("../../models/certificates");
const { Company } = require("../../models/company");
const { UserModel } = require("../../models/user");
const { VendorModel } = require("../../models/vendor");

exports.createVendor = async (req, res, next) => {
    try {
        console.log({body: req.body});
        const formDetails = req.body.registrationForm
        const certificates = req.body.certificates

        console.log({certificates});
        const user = req.user
        console.log({user});
        const userProfile = await UserModel.findOne({
            uid: user.uid
        })

        if (!userProfile) {
            throw new Error400Handler("This user does not exist")
        }

        const date = new Date()

        let newVendorRecord = new VendorModel({
            form: formDetails.form,
            modificationHistory: [
                {
                    date,
                    createdBy: user,
                    action: "Created"
                }
            ],
            vendorAppAdminUID: user.uid,
            vendorAppAdminProfile: userProfile._id
        })

        //Save new vendor model
        let savedVendor = await newVendorRecord.save()



        //Create company record
        let newCompanyRecord = new Company({
            companyName: formDetails.form.pages[0].sections[0].fields[0].value,
            vendor: savedVendor._id,
            userID: user.uid,
            vendorAppAdminProfile: userProfile._id,
            flags: {
                approvals: {
                    level: 0,
                    level0: {

                    }
                },
                approved: false,
                completed: false,
                stage: "pending",
                status: "approved",
                submitted: false

            }
        })

        

        let savedCompany = await newCompanyRecord.save()

        //Update new vendor record with new company id
        const updatedVendor = await VendorModel.findOneAndUpdate({_id: savedVendor._id}, {company: savedCompany._id})

        console.log({savedVendor, savedCompany});
        if (savedVendor && savedCompany) {
            sendBasicResponse(res, {vendorID: savedVendor._id})
        }
    } catch (error) {
        next(error)
    }
}

exports.updateVendor = async (req, res, next) => {
    try {
        console.log({body: req.body});
        const formDetails = req.body.registrationForm
        const certificates = req.body.certificates
        console.log({certificates});
        const user = req.user
        console.log({user});
        const userProfile = await UserModel.findOne({
            uid: user.uid
        })

        if (!userProfile) {
            throw new Error400Handler("This user does not exist")
        }

        
        const date = new Date()
        const updatedVendor = await VendorModel.findOneAndUpdate({_id: formDetails.vendorID}, {form: formDetails.form, $push: {modificationHistory: {
            date,
            createdBy: user,
            action: "Updated form"
        }}})

        //Find company record for this vendor
        const company = await Company.findOne({vendor: formDetails.vendorID})

        if (updatedVendor) {
            //Update certificates
            //This is another inelegant, inefficient solution that should be refactored if I don't do it
            if (certificates.length > 0) {
                let certificateUpdateCodes = []
                for (let index = 0; index < certificates.length; index++) {
                    const element = certificates[index];

                    //Check if file already exists in certificates collection
                    const ObjectId = require("mongoose").Types.ObjectId
                    console.log({url: element.url, name: element.name, label: element.label, vendor: new ObjectId(formDetails.vendorID)});
                    const certificate = await CertificateModel.findOne({updateCode: element.updateCode, vendor: new ObjectId(formDetails.vendorID)})

                    if (certificate) {
                        const updateCertificate = await CertificateModel.findOneAndUpdate({updateCode: element.updateCode, trackingStatus: "tracked"}, {trackingStatus: "untracked - updated"})
                    }

                    const newCertificate = new CertificateModel({
                        url: element.url,
                        name: element.name,
                        label: element.label,
                        vendor: formDetails.vendorID,
                        user: userProfile._id,
                        issueDate: element.issueDate,
                        expiryDate: element.expiryDate,
                        updateCode: element.updateCode,
                        company: company._id
                        
                    })

                    

                    await newCertificate.save()

                    
                    
                }
            }
            sendBasicResponse(res, {})
        } else {
            throw new Error500Handler("An internal error occured. Please try again later.")
        }

    } catch (error) {
        next(error)
    }
}