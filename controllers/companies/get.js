const { default: mongoose } = require("mongoose");
const { admin } = require("../../auth/initializeFirebase");
const { Error400Handler, Error403Handler } = require("../../errorHandling/errorHandlers");
const { sendBasicResponse } = require("../../helpers/response");
const { Company } = require("../../models/company");
const { FileModel } = require("../../models/file");
const { FormModel } = require("../../models/form");
const { Invite } = require("../../models/invite");
const { VendorModel } = require("../../models/vendor");
const { allCompanies } = require("./savedCompaniesData");
const { UserModel } = require("../../models/user");
const { CertificateModel } = require("../../models/certificates");

exports.fetchAllCompanies = async (req, res, next) => {
    try {
        console.log({body: req.body});
        
    } catch (error) {
        next(error)
    }
}

exports.findCompanyByString = async (req, res, next) => {
    try {
        const {queryString} = req.body

        if (!queryString) {
            throw new Error400Handler("Enter a company name to search")
        }

        const results = await Company.find({
            companyName: {$regex: queryString, $options: "i"}
        })

        let resultsList = []

        if (results.length > 0) {
            resultsList = results.sort((a, b) => {
                if (a.companyName < b.companyName) {
                    return -1;
                  }
                  if (a.companyName > b.companyName) {
                    return 1;
                  }
                  return 0;
            })
        }

        console.log({resultsList});

        sendBasicResponse(res, {companies: resultsList})
    } catch (error) {
        next(error)
    }
}



exports.fetchCompanyCurrentRegistrationStatus = async (req, res, next) => {
    try {
        console.log(req.body);
        const {email, companyName, type, inviteID} = req.body
        //Check if email has been used in an invite
        const inviteByEmail = await Invite.findOne({email})

        if (!type && !inviteID) {
            if (inviteByEmail && inviteByEmail.companyName !== companyName) {
                throw new Error403Handler("A company already exists with the provided email address. If they would like to register a parent company or subsidiary company, they would have to log in to their account using this email address to create one.")
            }
        }

        if (type === "resend" && inviteID) {
            const invite = await Invite({_id: inviteID})

            console.log({invite});
        }

        

        //check if companyName has been used in an invite
        const inviteByCompanyName = await Invite.findOne({companyName})

        //If company has been invited, check if the invite has been used
        //If it has not been used, check if the invite has expired
        //inviteStatus 1 is invited but not used, 2 is invited but invite expired while 3 is invited and used
        //Invite status is invited but not used and new email matches email on existing record of the same name

        if (inviteByCompanyName.used || inviteByEmail.used) {
            sendBasicResponse(res, {inviteStatus: 3})
        } else {
            if (email !== inviteByCompanyName.email) {
                return sendBasicResponse(res, {inviteStatus: 4})
            } else {
                const inviteExpired = inviteHasExpired(inviteByCompanyName)
                if (inviteExpired) {
                    return sendBasicResponse(res, {inviteStatus: 3})
                } else {
                    return sendBasicResponse(res, {inviteStatus: 2})
                }
            }

            
        }

    } catch (error) {
        next(error)
    }
}

exports.fetchAllApprovalData = async (req, res, next) => { 
    try {
        console.log("getting approval data");

        const invites = await Invite.find({}) 

        const user = await UserModel.findOne({uid: req.user.uid})

        console.log({requestingID: user});
        

        let sortedInvites = []

        if (invites.length > 0) {
            sortedInvites = invites.sort((a, b) => {
              const titleA = a.companyName.toUpperCase(); // ignore upper and lowercase
              const titleB = b.companyName.toUpperCase(); // ignore upper and lowercase
              if (titleA < titleB) {
                return -1;
              }
              if (titleA > titleB) {
                return 1;
              }
            
              // names must be equal
              return 0;
            });
        }

        const allCompanies = await Company.find({})


        let parkedL2 = []
        let l2 = []
        let l3 = []
        let returned = []
        let inProgress = []
        let needingAttendion = []
        let notNeedingAttention = []

        allCompanies.filter((item, index) => {
            if (!item?.flags?.status) {
                inProgress.push(item)
            }
            if (item?.flags?.stage === "suspended") {
                parkedL2.push(item)
            } else if (item?.flags?.stage === "approved") {
                l3.push(item)
            } else if (item?.flags?.stage === "returned") {
                returned.push(item)
            } else {
                l2.push(item)

                if (item.currentEndUsers.includes(user._id)) {
                    needingAttendion.push({...item._doc, needsAttention: true})
                } else {
                    notNeedingAttention.push(item)
                }
                
            }
        })

        //Sort notNeedingAttention
        notNeedingAttention = notNeedingAttention.sort((a, b) => {
            

            if (a?.companyName && b?.companyName) {
                const titleA = a?.companyName.toUpperCase(); // ignore upper and lowercase
            const titleB = b?.companyName.toUpperCase(); // ignore upper and lowercase
            if (titleA < titleB) {
              return -1;
            }
            if (titleA > titleB) {
              return 1;
            }
            } else {
                return 0
            }
          
            // names must be equal
            return 0;
        });

        console.log( {
            parkedL2: parkedL2.length,
            l3: l3.length,
            returned: returned.length,
            invites: sortedInvites.length
        });

        sendBasicResponse(res, {
            invites: sortedInvites,
            pendingL2: [...needingAttendion, ...notNeedingAttention],
            l3,
            completedL2: parkedL2,
            inProgress,
            returned
        })
    } catch (error) {
        next(error)
    }
}

exports.fetchDashboardData = async (req, res, next) => {
    try {
        const {uid} = req.user

        //Get user profile
        const user = await UserModel.findOne({uid})


        //Find all current vendor records for the requesting user
        const ObjectId = require("mongoose").Types.ObjectId
        const vendors = await VendorModel.find({vendorAppAdmin: new ObjectId(user._id)})
        const currentDate = new Date()

        const userFiles = await FileModel.find({userID: uid})

        

        //Check if the user has a registered company
        const companies = await Company.find({userID : uid})

        //Check if vendor has expired certificates
        const expiredCertificates = await CertificateModel.find({user: new ObjectId(user._id), expiryDate: {$lte: currentDate}}).populate("vendor")


         //Check if vendor has expiring certificates
         const dateIn3Months = new Date(currentDate.getTime() + (60 * 60 * 24 * 30 * 3 * 1000))
         const todaysDate = new Date()
         const expiringCertificates = await CertificateModel.find({user: new ObjectId(user._id), trackingStatus: "tracked", $and: [
            {
                expiryDate: {$gte: todaysDate}
            },
            {
                expiryDate: {$lte: dateIn3Months}
            }
         ]}).populate("vendor")



        if (companies.length === 0) {
            sendBasicResponse(res, {companies: [], expiringCertificates: [], expiredCertificates: []})
        } else {
            //Compile expiring and expired certificates


            sendBasicResponse(res, {companies, expiringCertificates: expiringCertificates.reverse(), expiredCertificates: expiredCertificates.reverse(), files: userFiles})
        }


    } catch (error) {
        next(error)
    }
}

exports.fetchRegistrationForm = async (req, res, next) => {
    try {
        console.log("Fetching form");
        const {uid} = req.user
        console.log({uid});
        //Get contractor registration form

        const registrationForm = await FormModel.findOne({"form.settings.isContractorApplicationForm": true}).select("-modificationHistory -formCreator -createdAt -updatedAt")

        if (registrationForm) {
            if (registrationForm.form.settings.enabled) {
                //Get current user's uploaded files
                const uploadedFiles = await FileModel.find({userID: uid})
                sendBasicResponse(res, {...registrationForm._doc, files: uploadedFiles})
            } else {
                throw new Error403Handler("Registration is currently disabled. Please try again later.")
            }
            
        } else {
            throw new Error400Handler("There isn't currently a registration form. Please contact the administrator for further assistance.")
        }

        

        console.log({registrationForm});
    } catch (error) {
        next(error)
    }
}

exports.fetchVendorRegistrationForm = async (req, res, next) => {
    try {
        console.log("Fetching form");
        const {uid} = req.user
        const {id} = req.params
        console.log({uid, body: req.params});
        //Get contractor registration form

        const generalRegistrationForm = await FormModel.findOne({"form.settings.isContractorApplicationForm": true}).select("-modificationHistory -formCreator -createdAt -updatedAt")

        const vendorRegistrationForm = await VendorModel.findOne({_id: id}).select("-modificationHistory -formCreator -createdAt -updatedAt")

        let tempRegistrationForm = {...generalRegistrationForm._doc}
        let tempVendorRegistrationForm = {...vendorRegistrationForm._doc}


        //This block copies values from the vendor's saved form to the general registration form. This ensures that the vendors always have access to the most recent version of the registration form
        for (let index = 0; index < tempRegistrationForm.form.pages.length; index++) {
            const page = tempRegistrationForm.form.pages[index];
            const vendorPage = tempVendorRegistrationForm?.form?.pages[index]

            if (vendorPage && (page.pageTitle === vendorPage.pageTitle)) {
                let vendorSectionIndex = 0
                for (let index2 = 0; index2 < page.sections.length; index2++) {
                    const section = page.sections[index2];
                    const vendorSection = vendorPage?.sections[vendorSectionIndex]



                    if (index === 0) {
                        console.log({index2, vendorSectionIndex});
                        console.log({isDuplicate: vendorSection.isDuplicate});
                    }
                    console.log({vendorTitle: vendorSection.title, sectionTitle: section.title});
                console.log({condition2: vendorSection.isDuplicate});

                    if (vendorSection  && !vendorSection.isDuplicate && (vendorSection.title === section.title)) {
                        
                        //I do not like that I had to do a three levels deep nested for-loop but time constraints left this as the quickest workable solution. Bear with me but please refactor this whenever you can.
                        for (let index3 = 0; index3 < section.fields.length; index3++) {
                            const field = section.fields[index3];
                            const vendorField = vendorSection.fields[index3]
        

                            if (vendorField && vendorField.label === field.label) {
                                tempRegistrationForm.form.pages[index].sections[index2].fields[index3].value = vendorField.value
                                tempRegistrationForm.form.pages[index].sections[index2].fields[index3].defaultValue = vendorField.defaultValue
                            }
                            
                        }
                        vendorSectionIndex++
                        
                        
                    } else if (vendorSection.isDuplicate) {
                        while (vendorPage?.sections[vendorSectionIndex].isDuplicate) {
                            vendorSectionIndex++
                        }

                        for (let index3 = 0; index3 < section.fields.length; index3++) {
                            const field = section.fields[index3];
                            const vendorField = vendorPage?.sections[vendorSectionIndex].fields[index3]
        

                            if (vendorField && vendorField.label === field.label) {
                                tempRegistrationForm.form.pages[index].sections[index2].fields[index3].value = vendorField.value
                                tempRegistrationForm.form.pages[index].sections[index2].fields[index3].defaultValue = vendorField.defaultValue
                            }
                            
                        }

                        vendorSectionIndex++
                    }
    
                }
            } else {
                continue
            }
        }

        console.log({tempFormLength: tempVendorRegistrationForm.form.pages[0].sections.length});

        //This blocks adds all duplicate fields to the registration form.
        for (let index = 0; index < tempVendorRegistrationForm.form.pages.length; index++) {
            const page = tempRegistrationForm.form.pages[index];
            const vendorPage = tempVendorRegistrationForm?.form?.pages[index]

            if (vendorPage && (page.pageTitle === vendorPage.pageTitle)) {
                let sectionIndex = 0

                while (sectionIndex < vendorPage.sections.length) {
                    const section = page.sections[sectionIndex];
                    const vendorSection = vendorPage?.sections[sectionIndex]

                    console.log({section: section?.title, vendorSection: vendorSection?.title});

                    if (vendorSection && section) {
                        if (vendorSection && (vendorSection.title === section.title)) {
                            let fieldIndex = 0
                            while (fieldIndex < vendorSection.fields.length) {
                                const field = section.fields[fieldIndex];
                                const vendorField = vendorSection.fields[fieldIndex]
            

                                if (vendorField.isDuplicate) {
                                    tempRegistrationForm.form.pages[index].sections[sectionIndex].fields.splice(fieldIndex, 0, vendorField)
                                }
    
                                fieldIndex++
                            }
                        } else {
                            if (vendorSection.isDuplicate) {
                                tempRegistrationForm.form.pages[index].sections.splice(sectionIndex, 0, vendorSection)
                            } 
                        }
                    } else {
                        if (vendorSection.isDuplicate) {
                            tempRegistrationForm.form.pages[index].sections.splice(sectionIndex, 0, vendorSection)
                        }
                    }

                    

                    
                    sectionIndex++
                }

            } else {
                continue
            }
        }



        if (generalRegistrationForm && vendorRegistrationForm) {
            if (generalRegistrationForm.form.settings.enabled) {
                //Get current user's uploaded files
                const uploadedFiles = await FileModel.find({userID: uid})
                sendBasicResponse(res, {generalRegistrationForm: {...tempRegistrationForm, files: uploadedFiles, vendorID: vendorRegistrationForm._doc._id}, baseRegistrationForm: {...generalRegistrationForm._doc, files: uploadedFiles}})
            } else {
                throw new Error403Handler("Registration is currently disabled. Please try again later.")
            }
            
        } else {
            throw new Error400Handler("There isn't currently a registration form. Please contact the administrator for further assistance.")
        }

        

        // console.log({registrationForm});
    }
    catch (error) {
        next(error)
    }
}

exports.fetchVendorApprovalData = async (req, res, next) => {
    try {
        console.log("Fetching form");
        const {uid} = req.user
        const {id} = req.params

        const company = await Company.findOne({vendor: id})

        if (!company) {
            throw new Error403Handler("The requested vendor record does not exist.")
        }

        console.log({uid, body: req.params});
        //Get contractor registration form

        const generalRegistrationForm = await FormModel.findOne({"form.settings.isContractorApplicationForm": true}).select("-modificationHistory -formCreator -createdAt -updatedAt")

        const vendorRegistrationForm = await VendorModel.findOne({_id: id}).select("-modificationHistory -formCreator -createdAt -updatedAt")

        let tempRegistrationForm = {...generalRegistrationForm._doc}
        let tempVendorRegistrationForm = {...vendorRegistrationForm._doc}


        //This block copies values from the vendor's saved form to the general registration form. This ensures that the vendors always have access to the most recent version of the registration form
        for (let index = 0; index < tempRegistrationForm.form.pages.length; index++) {
            const page = tempRegistrationForm.form.pages[index];
            const vendorPage = tempVendorRegistrationForm?.form?.pages[index]

            if (vendorPage && (page.pageTitle === vendorPage.pageTitle)) {
                let vendorSectionIndex = 0
                for (let index2 = 0; index2 < page.sections.length; index2++) {
                    const section = page.sections[index2];
                    const vendorSection = vendorPage?.sections[vendorSectionIndex]



                    if (vendorSection  && !vendorSection.isDuplicate && (vendorSection.title === section.title)) {
                        
                        //I do not like that I had to do a three levels deep nested for-loop but time constraints left this as the quickest workable solution. Bear with me but please refactor this whenever you can.
                        for (let index3 = 0; index3 < section.fields.length; index3++) {
                            const field = section.fields[index3];
                            const vendorField = vendorSection.fields[index3]
        

                            if (vendorField && vendorField.label === field.label) {
                                tempRegistrationForm.form.pages[index].sections[index2].fields[index3].value = vendorField.value
                                tempRegistrationForm.form.pages[index].sections[index2].fields[index3].defaultValue = vendorField.defaultValue
                            }
                            
                        }

                        tempRegistrationForm.form.pages[index].sections[index2]["approved"] = vendorSection.approved
                        tempRegistrationForm.form.pages[index].sections[index2]["remarks"] = vendorSection.remarks ? vendorSection.remarks : []
                        tempRegistrationForm.form.pages[index].sections[index2]["comments"] = vendorSection.comments ? vendorSection.comments : []

                        vendorSectionIndex++
                        
                        
                    } else if (vendorSection.isDuplicate) {
                        while (vendorPage?.sections[vendorSectionIndex].isDuplicate) {
                            vendorSectionIndex++
                        }

                        for (let index3 = 0; index3 < section.fields.length; index3++) {
                            const field = section.fields[index3];
                            const vendorField = vendorPage?.sections[vendorSectionIndex].fields[index3]
        

                            if (vendorField && vendorField.label === field.label) {
                                tempRegistrationForm.form.pages[index].sections[index2].fields[index3].value = vendorField.value
                                tempRegistrationForm.form.pages[index].sections[index2].fields[index3].defaultValue = vendorField.defaultValue
                            }
                            
                        }

                        vendorSectionIndex++
                    }
    
                }
            } else {
                continue
            }
        }

        console.log({tempFormLength: tempVendorRegistrationForm.form.pages[0].sections.length});

        //This blocks adds all duplicate fields to the registration form.
        for (let index = 0; index < tempVendorRegistrationForm.form.pages.length; index++) {
            const page = tempRegistrationForm.form.pages[index];
            const vendorPage = tempVendorRegistrationForm?.form?.pages[index]

            if (vendorPage && (page.pageTitle === vendorPage.pageTitle)) {
                let sectionIndex = 0

                while (sectionIndex < vendorPage.sections.length) {
                    const section = page.sections[sectionIndex];
                    const vendorSection = vendorPage?.sections[sectionIndex]

                    console.log({section: section?.title, vendorSection: vendorSection?.title});

                    if (vendorSection && section) {
                        if (vendorSection && (vendorSection.title === section.title)) {
                            let fieldIndex = 0
                            while (fieldIndex < vendorSection.fields.length) {
                                const field = section.fields[fieldIndex];
                                const vendorField = vendorSection.fields[fieldIndex]
            

                                if (vendorField.isDuplicate) {
                                    tempRegistrationForm.form.pages[index].sections[sectionIndex].fields.splice(fieldIndex, 0, vendorField)
                                }
    
                                fieldIndex++
                            }
                        } else {
                            if (vendorSection.isDuplicate) {
                                tempRegistrationForm.form.pages[index].sections.splice(sectionIndex, 0, vendorSection)
                            } 
                        }
                    } else {
                        if (vendorSection.isDuplicate) {
                            tempRegistrationForm.form.pages[index].sections.splice(sectionIndex, 0, vendorSection)
                        }
                    }

                    

                    
                    sectionIndex++
                }

            } else {
                continue
            }
        }



        if (generalRegistrationForm && vendorRegistrationForm) {
            if (generalRegistrationForm.form.settings.enabled) {
                //Get current user's uploaded files
                const uploadedFiles = await FileModel.find({userID: uid})
                sendBasicResponse(res, {approvalData: company, generalRegistrationForm: {...tempRegistrationForm, files: uploadedFiles, vendorID: vendorRegistrationForm._doc._id}, baseRegistrationForm: {...generalRegistrationForm._doc, files: uploadedFiles}})
            } else {
                throw new Error403Handler("Registration is currently disabled. Please try again later.")
            }
            
        } else {
            throw new Error400Handler("There isn't currently a registration form. Please contact the administrator for further assistance.")
        }

        

        // console.log({registrationForm});
    }
    catch (error) {
        next(error)
    }
}

const inviteHasExpired = invite => {
    if (invite.expiry._seconds) {
        const expiryDateTimestamp = invite.expiry._seconds * 1000
        const currentDate = new Date()
        const currentDateTimestamp = currentDate.getTime()

        if (expiryDateTimestamp < currentDateTimestamp) {
            return true
        } else {
            return false
        }
    } else if (invite.expiry) {
        const expiryDate = new Date(invite.expiry)
        const expiryDateTimestamp = expiryDate.getTime()
        const currentDateTimestamp = currentDate.getTime()

        if (expiryDateTimestamp < currentDateTimestamp) {
            return true
        } else {
            return false
        }
    }
}