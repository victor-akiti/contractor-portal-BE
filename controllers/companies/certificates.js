const { Error400Handler } = require("../../errorHandling/errorHandlers");
const { createNotification } = require("../../helpers/createNotification");
const { sendBasicResponse } = require("../../helpers/response");
const { CertificateModel } = require("../../models/certificates");
const { VendorModel } = require("../../models/vendor");

exports.updateCertificate = async (req, res, next) => {
    try {
        console.log(req.body);
        console.log(req.params);
        const {newCertificate, updateCode} = req.body

        if (!newCertificate || !updateCode) {
            throw new Error400Handler("There was an error with updateing your certificate. Please contact the site admin")
        }

        //Check if certificate to update exists
        const certificateToUpdate = await CertificateModel.findOne({
            updateCode,
            trackingStatus: "tracked"
        })

        if (certificateToUpdate) {
            //Create new certificate record
            const updatedCertificate = new CertificateModel({
                url: newCertificate.url,
                label: newCertificate.label,
                name: newCertificate.name,
                vendor: certificateToUpdate.vendor,
                user: certificateToUpdate.user,
                expiryDate: newCertificate.expiryDate,
                updateCode,
            })

            const savedNewCertificate = await updatedCertificate.save()

            console.log({savedNewCertificate});

            if (savedNewCertificate) {
                const updatedExistingCertificate = await CertificateModel.findOneAndUpdate({_id: certificateToUpdate._id, trackingStatus: "tracked"}, {trackingStatus: "untracked - updated"})

                console.log({updatedExistingCertificate});

                const vendorForm = await VendorModel.findOne({_id: certificateToUpdate.vendor})

                let vendorFormCopy = {...vendorForm._doc}

                console.log({vendorFormCopy});

                if (vendorForm) {
                    for (let index = 0; index < vendorForm.form.pages.length; index++) {
                        const element = vendorForm.form.pages[index];


                        for (let index2 = 0; index2 < element.sections.length; index2++) {
                            const element2 = element.sections[index2];



                            for (let index3 = 0; index3 < element2.fields.length; index3++) {
                                const element3 = element2.fields[index3];
                                
                                if (element3?.updateCode && element3?.updateCode === updateCode) {
                                    console.log("Found field", element3);
                                    vendorFormCopy.form.pages[index].sections[index2].fields[index3].value = [{
                                        ...vendorForm.form.pages[index].sections[index2].fields[index3].value,
                                        name: newCertificate.name,
                                        url: newCertificate.url,
                                        expiryDate: newCertificate.expiryDate
                                    }]
                                }
                            }
                            
                        }
                        
                    }

                    const updatedVendorForm = await VendorModel.findOneAndUpdate({_id: certificateToUpdate.vendor}, {form: vendorForm.form})

                    if (updatedVendorForm) {
                        createNotification(vendorForm._id, "Updated Certificate")
                        sendBasicResponse(res, {})
                    }

                    console.log({updatedVendorForm});
                }

            }
        }

        console.log({certificateToUpdate});

        

        //Update existing certificate to untracked - updated

        //Update form with new expiry date
    } catch (error) {
        next(error)
    }
}

exports.fetchVendorExpiringCertificates = (req, res, next) => {
    try {
        
    } catch (error) {
        next(error)
    }
}

exports.fetchVendorExpiredCertificates = (req, res, next) => {
    try {
        
    } catch (error) {
        next(error)
    }
}

exports.fetchVendorExpiredAndExpiringCertificates = (req, res, next) => {
    try {
        
    } catch (error) {
        next(error)
    }
}

exports.fetchAllExpiringAndExpiredCertificates = (req, res, next) => {
    try {
        
    } catch (error) {
        next(error)
    }
}