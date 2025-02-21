const { default: mongoose } = require("mongoose");
const { admin } = require("../../auth/initializeFirebase");
const {
  Error400Handler,
  Error403Handler,
} = require("../../errorHandling/errorHandlers");
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
    console.log({ body: req.body });
  } catch (error) {
    next(error);
  }
};

exports.findCompanyByString = async (req, res, next) => {
  try {
    const { queryString } = req.body;

    if (!queryString) {
      throw new Error400Handler("Enter a company name to search");
    }

    const results = await Company.find({
      companyName: { $regex: queryString, $options: "i" },
    });

    let resultsList = [];

    if (results.length > 0) {
      resultsList = results.sort((a, b) => {
        if (a.companyName < b.companyName) {
          return -1;
        }
        if (a.companyName > b.companyName) {
          return 1;
        }
        return 0;
      });
    }

    console.log({ resultsList });

    sendBasicResponse(res, { companies: resultsList });
  } catch (error) {
    next(error);
  }
};

exports.fetchCompanyCurrentRegistrationStatus = async (req, res, next) => {
  try {
    console.log(req.body);
    const { email, companyName, type, inviteID } = req.body;
    //Check if email has been used in an invite
    const inviteByEmail = await Invite.findOne({ email });

    if (!type && !inviteID) {
      if (inviteByEmail && inviteByEmail.companyName !== companyName) {
        throw new Error403Handler(
          "A company already exists with the provided email address. If they would like to register a parent company or subsidiary company, they would have to log in to their account using this email address to create one."
        );
      }
    }

    if (type === "resend" && inviteID) {
      const invite = await Invite({ _id: inviteID });

      console.log({ invite });
    }

    //check if companyName has been used in an invite
    const inviteByCompanyName = await Invite.findOne({ companyName });

    //If company has been invited, check if the invite has been used
    //If it has not been used, check if the invite has expired
    //inviteStatus 1 is invited but not used, 2 is invited but invite expired while 3 is invited and used
    //Invite status is invited but not used and new email matches email on existing record of the same name

    if (inviteByCompanyName.used || inviteByEmail.used) {
      sendBasicResponse(res, { inviteStatus: 3 });
    } else {
      if (email !== inviteByCompanyName.email) {
        return sendBasicResponse(res, { inviteStatus: 4 });
      } else {
        const inviteExpired = inviteHasExpired(inviteByCompanyName);
        if (inviteExpired) {
          return sendBasicResponse(res, { inviteStatus: 3 });
        } else {
          return sendBasicResponse(res, { inviteStatus: 2 });
        }
      }
    }
  } catch (error) {
    next(error);
  }
};

exports.fetchAllApprovalData = async (req, res, next) => {
  try {
    console.log("getting approval data");

    const invites = await Invite.find({});

    const user = await UserModel.findOne({ uid: req.user.uid });

    console.log({ requestingID: user });

    let sortedInvites = [];

    if (invites.length > 0) {
      sortedInvites = invites.sort((a, b) => {
        return String(String(a.companyName).toLocaleLowerCase()).localeCompare(String(b.companyName).toLocaleLowerCase());
      });
    }

    const allCompanies = await Company.find({}).populate(
      "vendorAppAdminProfile"
    ).lean();

    let parkedL2 = [];
    let l2 = [];
    let l3 = [];
    let returned = [];
    let inProgress = [];
    let needingAttendion = [];
    let notNeedingAttention = [];
    let parkRequested = [];

    allCompanies.filter((item, index) => {
      if (!item?.flags?.status) {
        inProgress.push(item);
      }

      if (
        item?.flags?.status === "suspended" ||
        item?.flags?.status === "parked"
      ) {
        parkedL2.push(item);
      } else if (item?.flags?.status === "recommended for hold") {
        parkRequested.push(item);
      } else if (item?.flags?.status === "incomplete") {
        inProgress.push(item);
      } else if (item?.flags?.status === "approved" && item?.flags?.approved) {
        l3.push(item);
      } else if (item?.flags?.status === "returned") {
        returned.push(item);
      } else if (
        item?.flags?.status === "recommended for hold" ||
        item?.flags?.status === "park requested" ||
        item?.flags?.stage === "recommended for hold"
      ) {
        parkRequested.push(item);
      } else {
        // l2.push(item);
        if (item?.flags?.submitted || item?.flags?.stage === "submitted") {
          
          if (item.currentEndUsers && item.currentEndUsers.includes(String(user._id))) {
            
            needingAttendion.push({ ...item, needsAttention: true });
          } else {
            notNeedingAttention.push(item);
          }
        }

        
      }
    });

    console.log({ needingAttendion });
    

    //Sort notNeedingAttention
    notNeedingAttention = sortListAlphabetically(notNeedingAttention);

    l3 = sortListAlphabetically(l3);

    returned = sortListAlphabetically(returned);

    inProgress = sortListAlphabetically(inProgress)

    parkedL2 = sortListAlphabetically(parkedL2)

    console.log({
      parkedL2: parkedL2.length,
      l3: l3.length,
      returned: returned.length,
      invites: sortedInvites.length,
      needingAttendion: needingAttendion.length,
      notNeedingAttention: notNeedingAttention.length,
    });

    sendBasicResponse(res, {
      invites: sortedInvites,
      pendingL2: [...needingAttendion, ...notNeedingAttention],
      l3,
      completedL2: parkedL2,
      inProgress,
      returned,
      parkRequested,
      all: allCompanies,
    });
  } catch (error) {
    next(error);
  }
};

const sortListAlphabetically = (list) => {
  return list.sort((a, b) => {
    return String(String(a?.companyName).toLocaleLowerCase()).localeCompare(String(b?.companyName).toLocaleLowerCase());

  });
};

exports.fetchDashboardData = async (req, res, next) => {
  try {
    const { uid } = req.user;

    //Get user profile
    const user = await UserModel.findOne({ uid });

    console.log({ user });

    //Find all current vendor records for the requesting user
    const ObjectId = require("mongoose").Types.ObjectId;
    const vendors = await VendorModel.find({
      vendorAppAdminProfile: new ObjectId(user._id),
    });

    //Check if the user has a registered company
    const companies = await Company.find({ userID: uid });
    const modifiedCompanies = []

    console.log({ vendors, companies });

    if (vendors.length === 0 && companies.length > 0) {
      //Check if user has old company record
      const registrationForm = await FormModel.findOne({
        "form.settings.isContractorApplicationForm": true,
      }).select("-modificationHistory -formCreator -createdAt -updatedAt");

      const registrationForms = [];


      for (let index = 0; index < companies.length ; index++) {
        const subRegistrationForm = await FormModel.findOne({
            "form.settings.isContractorApplicationForm": true,
          }).select("-modificationHistory -formCreator -createdAt -updatedAt");

          const registrationFormCopy = { ...subRegistrationForm._doc };

        const item = companies[index];

        console.log(item.companyName);
        

        //Get general form
        
        registrationFormCopy["companyName"] = item.companyName;

        delete registrationFormCopy._id;

        registrationFormCopy.form.pages[0].sections[0].fields[0].value =
          item.companyName;
        registrationFormCopy.form.pages[0].sections[0].fields[1].value =
          item.cacForm2A && item.cacForm7
            ? "Company Registration"
            : "Business Name Registration";
        registrationFormCopy.form.pages[0].sections[0].fields[3].value =
          item.taxIDNumber;
        registrationFormCopy.form.pages[0].sections[0].fields[4].value = [];
        registrationFormCopy.form.pages[0].sections[0].fields[2].value =
          item.registeredNumber;

        item.tinCertificate.map((certificateItem) => {
            registrationFormCopy.form.pages[0].sections[0].fields[4].value.push({
            url: certificateItem.downloadURL,
            label: "Upload TIN Certificate",
            name: certificateItem.name,
          });
        });

        registrationFormCopy.form.pages[0].sections[0].fields[5].value =
          item.website;

        registrationFormCopy.form.pages[0].sections[0].fields[6].value = [];

        item.certificateOfRegistration.map((certificateItem) => {
            registrationFormCopy.form.pages[0].sections[0].fields[4].value.push({
            url: certificateItem.downloadURL,
            label: "Upload Company Registration Certificate",
            name: certificateItem.name,
          });
        });

        if (item.cacForm2A) {
            registrationFormCopy.form.pages[0].sections[0].fields[7].value = []
            item.cacForm2A.map((certificateItem) => {
                registrationFormCopy.form.pages[0].sections[0].fields[7].value.push({
                url: certificateItem.downloadURL,
                label: "Upload Company Registration Certificate",
                name: certificateItem.name,
              });
            });
        }

        if (item.cacForm7) {
            registrationFormCopy.form.pages[0].sections[0].fields[8].value = [];
            item.cacForm7.map((certificateItem) => {
                registrationFormCopy.form.pages[0].sections[0].fields[8].value.push({
                url: certificateItem.downloadURL,
                label: "Upload CACForm7",
                name: certificateItem.name,
              });
            });
        }

        if (item.cacBNForm1) {
            registrationFormCopy.form.pages[0].sections[0].fields[8].value = [];
            item.cacBNForm1.map((certificateItem) => {
                registrationFormCopy.form.pages[0].sections[0].fields[8].value.push({
                url: certificateItem.downloadURL,
                label: "Upload CAC/BN Form 1",
                name: certificateItem.name,
              });
            });
        }

        if (item?.hqAddress) {
            registrationFormCopy.form.pages[0].sections[2].fields[0].value = item?.hqAddress?.line1
            registrationFormCopy.form.pages[0].sections[2].fields[3].value = item?.hqAddress?.country
            registrationFormCopy.form.pages[0].sections[2].fields[4].value = item?.hqAddress?.state
            registrationFormCopy.form.pages[0].sections[2].fields[3].value = item?.hqAddress?.city
        }

        if (item.branchAddresses) {
            registrationFormCopy.form.pages[0].sections[3].fields[0].value = item?.branchAddresses[0]?.line1
            registrationFormCopy.form.pages[0].sections[3].fields[3].value = item?.branchAddresses[0]?.country
            registrationFormCopy.form.pages[0].sections[3].fields[4].value = item?.branchAddresses[0]?.state
            registrationFormCopy.form.pages[0].sections[3].fields[3].value = item?.branchAddresses[0]?.city
        }

        if (item.primaryContact) {
            registrationFormCopy.form.pages[0].sections[4].fields[0].value = item?.primaryContact?.title
            registrationFormCopy.form.pages[0].sections[4].fields[1].value = item?.primaryContact?.firstName
            registrationFormCopy.form.pages[0].sections[4].fields[2].value = item?.primaryContact?.familyName
            registrationFormCopy.form.pages[0].sections[4].fields[3].value = item?.primaryContact?.designation
            registrationFormCopy.form.pages[0].sections[4].fields[4].value = item?.primaryContact?.email
            registrationFormCopy.form.pages[0].sections[4].fields[5].value = item?.primaryContact?.phone1?.internationalNumber ? item?.primaryContact?.phone1.internationalNumber : item?.primaryContact?.phone1
            registrationFormCopy.form.pages[0].sections[4].fields[6].value = item?.primaryContact?.phone2?.internationalNumber ? item?.primaryContact?.phone2.internationalNumber : item?.primaryContact?.phone2
        }

        if (item.secondaryContact) {
            registrationFormCopy.form.pages[0].sections[5].fields[0].value = item?.secondaryContact?.title
            registrationFormCopy.form.pages[0].sections[5].fields[1].value = item?.secondaryContact?.firstName
            registrationFormCopy.form.pages[0].sections[5].fields[3].value = item?.secondaryContact?.familyName
            registrationFormCopy.form.pages[0].sections[5].fields[4].value = item?.secondaryContact?.designation
            registrationFormCopy.form.pages[0].sections[5].fields[5].value = item?.secondaryContact?.email
            registrationFormCopy.form.pages[0].sections[5].fields[6].value = item?.secondaryContact?.phone1?.internationalNumber ? item?.primaryContact?.phone1.internationalNumber : item?.primaryContact?.phone1
            registrationFormCopy.form.pages[0].sections[5].fields[7].value = item?.secondaryContact?.phone2?.internationalNumber ? item?.primaryContact?.phone2.internationalNumber : item?.primaryContact?.phone2
        }

        //Add hq address
        

        registrationForms.push(registrationFormCopy);

        const newVendorForm = new VendorModel({
            form: registrationFormCopy.form,
            modificationHistory: [],
            companyType: "Standalone",
            vendorAppAdminProfile: user._id,
            vendorAppAdminUID: uid,
            company: item._id
        })

        const savedNewVendor = await newVendorForm.save();

        //Add vendor id to company
        const updatedCompany = await Company.findOneAndUpdate({ _id: item._id }, { vendor: savedNewVendor._id, vendorAppAdminProfile: user._id, userID: uid });

        updatedCompany.vendor = savedNewVendor._id





        modifiedCompanies.push(updatedCompany)
    
      }

      sendBasicResponse(res, {
        companies: modifiedCompanies,
        expiringCertificates: [],
        expiredCertificates: [],
        files: [],
        registrationForms,
        mainForm: registrationForm
      });
    } else {
      const currentDate = new Date();

      const userFiles = await FileModel.find({ userID: uid });

      if (companies.length === 0) {
        sendBasicResponse(res, {
          companies: [],
          expiringCertificates: [],
          expiredCertificates: [],
        });
      } else {
        //Compile expiring and expired certificates
        //Check if vendor has expired certificates
        const userCompaniesSearchParameters = [];
        for (let index = 0; index < companies.length; index++) {
          userCompaniesSearchParameters.push({
            vendor: new ObjectId(companies[index]._id),
          });
        }
        console.log({ userCompaniesSearchParameters });

        const expiredCertificates = await CertificateModel.find({
          vendor: companies[0]._id,
          trackingStatus: "tracked",
          expiryDate: { $lte: currentDate },
        }).populate("vendor");

        //Check if vendor has expiring certificates
        const dateIn3Months = new Date(
          currentDate.getTime() + 60 * 60 * 24 * 30 * 3 * 1000
        );
        const todaysDate = new Date();
        const expiringCertificates = await CertificateModel.find({
          user: new ObjectId(user._id),
          trackingStatus: "tracked",
          $and: [
            {
              expiryDate: { $gte: todaysDate },
            },
            {
              expiryDate: { $lte: dateIn3Months },
            },
          ],
        }).populate("vendor");

        sendBasicResponse(res, {
          companies,
          expiringCertificates: expiringCertificates.reverse(),
          expiredCertificates: expiredCertificates.reverse(),
          files: userFiles,
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

exports.fetchRegistrationForm = async (req, res, next) => {
  try {
    console.log("Fetching form");
    const { uid } = req.user;
    console.log({ uid });
    //Get contractor registration form

    const registrationForm = await FormModel.findOne({
      "form.settings.isContractorApplicationForm": true,
    }).select("-modificationHistory -formCreator -createdAt -updatedAt");

    if (registrationForm) {
      if (registrationForm.form.settings.enabled) {
        //Get current user's uploaded files
        const uploadedFiles = await FileModel.find({ userID: uid });
        sendBasicResponse(res, {
          ...registrationForm._doc,
          files: uploadedFiles,
        });
      } else {
        throw new Error403Handler(
          "Registration is currently disabled. Please try again later."
        );
      }
    } else {
      throw new Error400Handler(
        "There isn't currently a registration form. Please contact the administrator for further assistance."
      );
    }

    console.log({ registrationForm });
  } catch (error) {
    next(error);
  }
};

exports.fetchVendorRegistrationForm = async (req, res, next) => {
  try {
    console.log("Fetching form");
    const { uid } = req.user;
    const { id } = req.params;
    console.log({ uid, body: req.params });
    //Get contractor registration form

    const generalRegistrationForm = await FormModel.findOne({
      "form.settings.isContractorApplicationForm": true,
    }).select("-modificationHistory -formCreator -createdAt -updatedAt");

    const vendorRegistrationForm = await VendorModel.findOne({
      _id: id,
    }).select("-modificationHistory -formCreator -createdAt -updatedAt");

    let tempRegistrationForm = { ...generalRegistrationForm._doc };
    let tempVendorRegistrationForm = { ...vendorRegistrationForm._doc };

    //This block copies values from the vendor's saved form to the general registration form. This ensures that the vendors always have access to the most recent version of the registration form
    for (
      let index = 0;
      index < tempRegistrationForm.form.pages.length;
      index++
    ) {
      const page = tempRegistrationForm.form.pages[index];
      const vendorPage = tempVendorRegistrationForm?.form?.pages[index];

      if (vendorPage && page.pageTitle === vendorPage.pageTitle) {
        let vendorSectionIndex = 0;
        for (let index2 = 0; index2 < page.sections.length; index2++) {
          const section = page.sections[index2];
          const vendorSection = vendorPage?.sections[vendorSectionIndex];

          if (index === 0) {
            console.log({ index2, vendorSectionIndex });
            console.log({ isDuplicate: vendorSection.isDuplicate });
          }
          console.log({
            vendorTitle: vendorSection.title,
            sectionTitle: section.title,
          });
          console.log({ condition2: vendorSection.isDuplicate });

          if (
            vendorSection &&
            !vendorSection.isDuplicate &&
            vendorSection.title === section.title
          ) {
            //I do not like that I had to do a three levels deep nested for-loop but time constraints left this as the quickest workable solution. Bear with me but please refactor this whenever you can.
            for (let index3 = 0; index3 < section.fields.length; index3++) {
              const field = section.fields[index3];
              const vendorField = vendorSection.fields[index3];

              if (vendorField && vendorField.label === field.label) {
                tempRegistrationForm.form.pages[index].sections[index2].fields[
                  index3
                ].value = vendorField.value;
                tempRegistrationForm.form.pages[index].sections[index2].fields[
                  index3
                ].defaultValue = vendorField.defaultValue;
              }
            }
            vendorSectionIndex++;
          } else if (vendorSection.isDuplicate) {
            while (vendorPage?.sections[vendorSectionIndex].isDuplicate) {
              vendorSectionIndex++;
            }

            for (let index3 = 0; index3 < section.fields.length; index3++) {
              const field = section.fields[index3];
              const vendorField =
                vendorPage?.sections[vendorSectionIndex].fields[index3];

              if (vendorField && vendorField.label === field.label) {
                tempRegistrationForm.form.pages[index].sections[index2].fields[
                  index3
                ].value = vendorField.value;
                tempRegistrationForm.form.pages[index].sections[index2].fields[
                  index3
                ].defaultValue = vendorField.defaultValue;
              }
            }

            vendorSectionIndex++;
          }
        }
      } else {
        continue;
      }
    }

    console.log({
      tempFormLength: tempVendorRegistrationForm.form.pages[0].sections.length,
    });

    //This blocks adds all duplicate fields to the registration form.
    for (
      let index = 0;
      index < tempVendorRegistrationForm.form.pages.length;
      index++
    ) {
      const page = tempRegistrationForm.form.pages[index];
      const vendorPage = tempVendorRegistrationForm?.form?.pages[index];

      if (vendorPage && page.pageTitle === vendorPage.pageTitle) {
        let sectionIndex = 0;

        while (sectionIndex < vendorPage.sections.length) {
          const section = page.sections[sectionIndex];
          const vendorSection = vendorPage?.sections[sectionIndex];

          console.log({
            section: section?.title,
            vendorSection: vendorSection?.title,
          });

          if (vendorSection && section) {
            if (vendorSection && vendorSection.title === section.title) {
              let fieldIndex = 0;
              while (fieldIndex < vendorSection.fields.length) {
                const field = section.fields[fieldIndex];
                const vendorField = vendorSection.fields[fieldIndex];

                if (vendorField.isDuplicate) {
                  tempRegistrationForm.form.pages[index].sections[
                    sectionIndex
                  ].fields.splice(fieldIndex, 0, vendorField);
                }

                fieldIndex++;
              }
            } else {
              if (vendorSection.isDuplicate) {
                tempRegistrationForm.form.pages[index].sections.splice(
                  sectionIndex,
                  0,
                  vendorSection
                );
              }
            }
          } else {
            if (vendorSection.isDuplicate) {
              tempRegistrationForm.form.pages[index].sections.splice(
                sectionIndex,
                0,
                vendorSection
              );
            }
          }

          sectionIndex++;
        }
      } else {
        continue;
      }
    }

    if (generalRegistrationForm && vendorRegistrationForm) {
      if (generalRegistrationForm.form.settings.enabled) {
        //Get current user's uploaded files
        const uploadedFiles = await FileModel.find({ userID: uid });
        sendBasicResponse(res, {
          generalRegistrationForm: {
            ...tempRegistrationForm,
            files: uploadedFiles,
            vendorID: vendorRegistrationForm._doc._id,
          },
          baseRegistrationForm: {
            ...generalRegistrationForm._doc,
            files: uploadedFiles,
          },
        });
      } else {
        throw new Error403Handler(
          "Registration is currently disabled. Please try again later."
        );
      }
    } else {
      throw new Error400Handler(
        "There isn't currently a registration form. Please contact the administrator for further assistance."
      );
    }

    // console.log({registrationForm});
  } catch (error) {
    next(error);
  }
};

exports.fetchVendorApprovalData = async (req, res, next) => {
  try {
    console.log("Fetching form");
    const { uid } = req.user;
    const { id } = req.params;
    const user = await UserModel.findOne({ uid });

    const company = await Company.findOne({ _id: id });

    if (!company) {
      throw new Error403Handler("The requested vendor record does not exist.");
    }

    console.log({ uid, body: req.params });
    //Get contractor registration form

    const generalRegistrationForm = await FormModel.findOne({
      "form.settings.isContractorApplicationForm": true,
    }).select("-modificationHistory -formCreator -createdAt -updatedAt");

    const vendorRegistrationForm = await VendorModel.findOne({
      _id: company.vendor,
    }).select("-modificationHistory -formCreator -createdAt -updatedAt");

    if (company && vendorRegistrationForm) {
      let tempRegistrationForm = { ...generalRegistrationForm._doc };
      let tempVendorRegistrationForm = { ...vendorRegistrationForm._doc };

      //This block copies values from the vendor's saved form to the general registration form. This ensures that the vendors always have access to the most recent version of the registration form
      for (
        let index = 0;
        index < tempRegistrationForm.form.pages.length;
        index++
      ) {
        const page = tempRegistrationForm.form.pages[index];
        const vendorPage = tempVendorRegistrationForm?.form?.pages[index];

        if (vendorPage && page.pageTitle === vendorPage.pageTitle) {
          let vendorSectionIndex = 0;
          for (let index2 = 0; index2 < page.sections.length; index2++) {
            const section = page.sections[index2];
            const vendorSection = vendorPage?.sections[vendorSectionIndex];

            if (
              vendorSection &&
              !vendorSection.isDuplicate &&
              vendorSection.title === section.title
            ) {
              //I do not like that I had to do a three levels deep nested for-loop but time constraints left this as the quickest workable solution. Bear with me but please refactor this whenever you can.
              for (let index3 = 0; index3 < section.fields.length; index3++) {
                const field = section.fields[index3];
                const vendorField = vendorSection.fields[index3];

                if (vendorField && vendorField.label === field.label) {
                  tempRegistrationForm.form.pages[index].sections[index2].fields[
                    index3
                  ].value = vendorField.value;
                  tempRegistrationForm.form.pages[index].sections[index2].fields[
                    index3
                  ].defaultValue = vendorField.defaultValue;
                }
              }

              tempRegistrationForm.form.pages[index].sections[index2][
                "approved"
              ] = vendorSection.approved;
              tempRegistrationForm.form.pages[index].sections[index2]["remarks"] =
                vendorSection.remarks ? vendorSection.remarks : [];
              tempRegistrationForm.form.pages[index].sections[index2][
                "comments"
              ] = vendorSection.comments ? vendorSection.comments : [];

              vendorSectionIndex++;
            } else if (vendorSection.isDuplicate) {
              while (vendorPage?.sections[vendorSectionIndex].isDuplicate) {
                vendorSectionIndex++;
              }

              for (let index3 = 0; index3 < section.fields.length; index3++) {
                const field = section.fields[index3];
                const vendorField =
                  vendorPage?.sections[vendorSectionIndex].fields[index3];

                if (vendorField && vendorField.label === field.label) {
                  tempRegistrationForm.form.pages[index].sections[index2].fields[
                    index3
                  ].value = vendorField.value;
                  tempRegistrationForm.form.pages[index].sections[index2].fields[
                    index3
                  ].defaultValue = vendorField.defaultValue;
                }
              }

              vendorSectionIndex++;
            }
          }
        } else {
          continue;
        }
      }

      console.log({
        tempFormLength: tempVendorRegistrationForm.form.pages[0].sections.length,
      });

      //This blocks adds all duplicate fields to the registration form.
      for (
        let index = 0;
        index < tempVendorRegistrationForm.form.pages.length;
        index++
      ) {
        const page = tempRegistrationForm.form.pages[index];
        const vendorPage = tempVendorRegistrationForm?.form?.pages[index];

        if (vendorPage && page.pageTitle === vendorPage.pageTitle) {
          let sectionIndex = 0;

          while (sectionIndex < vendorPage.sections.length) {
            const section = page.sections[sectionIndex];
            const vendorSection = vendorPage?.sections[sectionIndex];

            console.log({
              section: section?.title,
              vendorSection: vendorSection?.title,
            });

            if (vendorSection && section) {
              if (vendorSection && vendorSection.title === section.title) {
                let fieldIndex = 0;
                while (fieldIndex < vendorSection.fields.length) {
                  const field = section.fields[fieldIndex];
                  const vendorField = vendorSection.fields[fieldIndex];

                  if (vendorField.isDuplicate) {
                    tempRegistrationForm.form.pages[index].sections[
                      sectionIndex
                    ].fields.splice(fieldIndex, 0, vendorField);
                  }

                  fieldIndex++;
                }
              } else {
                if (vendorSection.isDuplicate) {
                  tempRegistrationForm.form.pages[index].sections.splice(
                    sectionIndex,
                    0,
                    vendorSection
                  );
                }
              }
            } else {
              if (vendorSection.isDuplicate) {
                tempRegistrationForm.form.pages[index].sections.splice(
                  sectionIndex,
                  0,
                  vendorSection
                );
              }
            }

            sectionIndex++;
          }
        } else {
          continue;
        }
      }

      if (generalRegistrationForm && vendorRegistrationForm) {
        if (generalRegistrationForm.form.settings.enabled) {
          //Get current user's uploaded files
          const uploadedFiles = await FileModel.find({ userID: uid });
          sendBasicResponse(res, {
            approvalData: company,
            generalRegistrationForm: {
              ...tempRegistrationForm,
              files: uploadedFiles,
              vendorID: vendorRegistrationForm._doc._id,
            },
            baseRegistrationForm: {
              ...generalRegistrationForm._doc,
              files: uploadedFiles,
            },
          });
        } else {
          throw new Error403Handler(
            "Registration is currently disabled. Please try again later."
          );
        }
      } else {
        throw new Error400Handler(
          "There isn't currently a registration form. Please contact the administrator for further assistance."
        );
      }
    } else {
      //Check if user has old company record
      const registrationForm = await FormModel.findOne({
        "form.settings.isContractorApplicationForm": true,
      }).select("-modificationHistory -formCreator -createdAt -updatedAt");

      const registrationForms = [];



        const subRegistrationForm = await FormModel.findOne({
            "form.settings.isContractorApplicationForm": true,
          }).select("-modificationHistory -formCreator -createdAt -updatedAt");

          const registrationFormCopy = { ...subRegistrationForm._doc };

        const item = company;

        console.log(item.companyName);
        

        //Get general form
        
        registrationFormCopy["companyName"] = item.companyName;

        delete registrationFormCopy._id;

        registrationFormCopy.form.pages[0].sections[0].fields[0].value =
          item.companyName;
        registrationFormCopy.form.pages[0].sections[0].fields[1].value =
          item.cacForm2A && item.cacForm7
            ? "Company Registration"
            : "Business Name Registration";
        registrationFormCopy.form.pages[0].sections[0].fields[3].value =
          item.taxIDNumber;
        registrationFormCopy.form.pages[0].sections[0].fields[4].value = [];
        registrationFormCopy.form.pages[0].sections[0].fields[2].value =
          item.registeredNumber;

        item.tinCertificate.map((certificateItem) => {
            registrationFormCopy.form.pages[0].sections[0].fields[4].value.push({
            url: certificateItem.downloadURL,
            label: "Upload TIN Certificate",
            name: certificateItem.name,
          });
        });

        registrationFormCopy.form.pages[0].sections[0].fields[5].value =
          item.website;

        registrationFormCopy.form.pages[0].sections[0].fields[6].value = [];

        item.certificateOfRegistration.map((certificateItem) => {
            registrationFormCopy.form.pages[0].sections[0].fields[4].value.push({
            url: certificateItem.downloadURL,
            label: "Upload Company Registration Certificate",
            name: certificateItem.name,
          });
        });

        if (item.cacForm2A) {
            registrationFormCopy.form.pages[0].sections[0].fields[7].value = []
            item.cacForm2A.map((certificateItem) => {
                registrationFormCopy.form.pages[0].sections[0].fields[7].value.push({
                url: certificateItem.downloadURL,
                label: "Upload Company Registration Certificate",
                name: certificateItem.name,
              });
            });
        }

        if (item.cacForm7) {
            registrationFormCopy.form.pages[0].sections[0].fields[8].value = [];
            item.cacForm7.map((certificateItem) => {
                registrationFormCopy.form.pages[0].sections[0].fields[8].value.push({
                url: certificateItem.downloadURL,
                label: "Upload CACForm7",
                name: certificateItem.name,
              });
            });
        }

        if (item.cacBNForm1) {
            registrationFormCopy.form.pages[0].sections[0].fields[8].value = [];
            item.cacBNForm1.map((certificateItem) => {
                registrationFormCopy.form.pages[0].sections[0].fields[8].value.push({
                url: certificateItem.downloadURL,
                label: "Upload CAC/BN Form 1",
                name: certificateItem.name,
              });
            });
        }

        if (item?.hqAddress) {
            registrationFormCopy.form.pages[0].sections[2].fields[0].value = item?.hqAddress?.line1
            registrationFormCopy.form.pages[0].sections[2].fields[3].value = item?.hqAddress?.country
            registrationFormCopy.form.pages[0].sections[2].fields[4].value = item?.hqAddress?.state
            registrationFormCopy.form.pages[0].sections[2].fields[3].value = item?.hqAddress?.city
        }

        if (item.branchAddresses) {
            registrationFormCopy.form.pages[0].sections[3].fields[0].value = item?.branchAddresses[0]?.line1
            registrationFormCopy.form.pages[0].sections[3].fields[3].value = item?.branchAddresses[0]?.country
            registrationFormCopy.form.pages[0].sections[3].fields[4].value = item?.branchAddresses[0]?.state
            registrationFormCopy.form.pages[0].sections[3].fields[3].value = item?.branchAddresses[0]?.city
        }

        if (item.primaryContact) {
            registrationFormCopy.form.pages[0].sections[4].fields[0].value = item?.primaryContact?.title
            registrationFormCopy.form.pages[0].sections[4].fields[1].value = item?.primaryContact?.firstName
            registrationFormCopy.form.pages[0].sections[4].fields[2].value = item?.primaryContact?.familyName
            registrationFormCopy.form.pages[0].sections[4].fields[3].value = item?.primaryContact?.designation
            registrationFormCopy.form.pages[0].sections[4].fields[4].value = item?.primaryContact?.email
            registrationFormCopy.form.pages[0].sections[4].fields[5].value = item?.primaryContact?.phone1?.internationalNumber ? item?.primaryContact?.phone1.internationalNumber : item?.primaryContact?.phone1
            registrationFormCopy.form.pages[0].sections[4].fields[6].value = item?.primaryContact?.phone2?.internationalNumber ? item?.primaryContact?.phone2.internationalNumber : item?.primaryContact?.phone2
        }

        if (item.secondaryContact) {
            registrationFormCopy.form.pages[0].sections[5].fields[0].value = item?.secondaryContact?.title
            registrationFormCopy.form.pages[0].sections[5].fields[1].value = item?.secondaryContact?.firstName
            registrationFormCopy.form.pages[0].sections[5].fields[3].value = item?.secondaryContact?.familyName
            registrationFormCopy.form.pages[0].sections[5].fields[4].value = item?.secondaryContact?.designation
            registrationFormCopy.form.pages[0].sections[5].fields[5].value = item?.secondaryContact?.email
            if (item?.secondaryContact?.phone1?.internationalNumber) {
                registrationFormCopy.form.pages[0].sections[5].fields[6].value = item?.secondaryContact?.phone1.internationalNumber
            } else {
                registrationFormCopy.form.pages[0].sections[5].fields[6].value = item?.secondaryContact?.phone1
            }

            if (item?.secondaryContact?.phone2?.internationalNumber) {
                registrationFormCopy.form.pages[0].sections[5].fields[7].value = item?.secondaryContact?.phone2.internationalNumber
            } else {
                registrationFormCopy.form.pages[0].sections[5].fields[7].value = item?.secondaryContact?.phone2
            }
            // registrationFormCopy.form.pages[0].sections[5].fields[6].value = item?.secondaryContact?.phone1?.internationalNumber ? item?.primaryContact?.phone1.internationalNumber : item?.primaryContact?.phone1
            // registrationFormCopy.form.pages[0].sections[5].fields[7].value = item?.secondaryContact?.phone2?.internationalNumber ? item?.primaryContact?.phone2.internationalNumber : item?.primaryContact?.phone2
        }

        //Add hse record

        //Get reporting date
        const reportingPeriodStart = item?.safetyRecord?.reportingPeriod?.fromDate
        const reportingPeriodEnd = item?.safetyRecord?.reportingPeriod?.toDate

        if (reportingPeriodEnd && reportingPeriodEnd._seconds) {
          const reportingPeriodEndDate = new Date(reportingPeriodEnd._seconds * 1000);
          const reportingPeriodStartDate = new Date(reportingPeriodStart._seconds * 1000);
          const currentDate = new Date();

          
          if (item?.reportingPeriodDate?.getFullYear() >= currentDate?.getFullYear() - 1) {
            registrationFormCopy.form.pages[1].sections[0].fields[0].value = reportingPeriodStartDate
            registrationFormCopy.form.pages[1].sections[0].fields[1].value = reportingPeriodEndDate
            registrationFormCopy.form.pages[1].sections[0].fields[2].value = item?.safetyRecord?.hoursWorked
            registrationFormCopy.form.pages[1].sections[0].fields[3].value = item?.safetyRecord?.fatalities
            registrationFormCopy.form.pages[1].sections[0].fields[4].value = item?.safetyRecord?.lti
            registrationFormCopy.form.pages[1].sections[0].fields[5].value = item?.safetyRecord?.recordableIncidents
            registrationFormCopy.form.pages[1].sections[0].fields[6].value = item?.safetyRecord?.environmentalSpills
          } else {
            registrationFormCopy.form.pages[1].sections[0]["history"] = {
              "fromDate" : {
                label: "From Date",
                value: reportingPeriodStartDate 
              },
              "toDate" : {
                label: "To Date",
                value: reportingPeriodEndDate
              },
              "hoursWorked" : {
                label: "Hours Worked",
                value: item?.safetyRecord?.hoursWorked
              },
              "fatalities" : {
                label: "Fatalities",
                value: item?.safetyRecord?.fatalities
              },
              "lti" : {
                label: "LTI",
                value: item?.safetyRecord?.lti
              },
              "recordableIncidents" : {
                label: "Recordable Incidents",
                value: item?.safetyRecord?.recordableIncidents
              },
              "environmentalSpills" : {
                label: "Environmental Spills",
                value: item?.safetyRecord?.environmentalSpills
              
              }
            }
          }

          
        }

        //Add financial performance record
        if (item?.financialPerformance) {

          registrationFormCopy.form.pages[2].sections[0].fields[0].value = item?.financialPerformance?.financialYear
          registrationFormCopy.form.pages[2].sections[0].fields[1].value = item?.financialPerformance?.turnover

          if (item.financialPerformance?.taxClearanceCert) {
            registrationFormCopy.form.pages[2].sections[0].fields[3].value = [{
              url: item.financialPerformance?.taxClearanceCert[0]?.downloadURL,
              label : item.financialPerformance?.taxClearanceCert[0]?.label,
              name: item.financialPerformance?.taxClearanceCert[0]?.name
            }]
          }

          if (item.financialPerformance?.auditedAccounts) {
            registrationFormCopy.form.pages[2].sections[0].fields[4].value = [{
              url: item.financialPerformance?.auditedAccounts[0]?.downloadURL,
              label : item.financialPerformance?.auditedAccounts[0]?.label,
              name: item.financialPerformance?.auditedAccounts[0]?.name
            }]
          }
          
          
        }


        


        registrationForms.push(registrationFormCopy);

        const currentVendorAppAdmin = await UserModel.findOne({ uid: company.userID});

        const newVendorForm = new VendorModel({
            form: registrationFormCopy.form,
            modificationHistory: [],
            companyType: "Standalone",
            vendorAppAdminUID: uid,
            vendorAppAdminProfile: currentVendorAppAdmin._id,
            company: item._id
        })

        const savedNewVendor = await newVendorForm.save();

        //Add vendor id to company
        const updatedCompany = await Company.findOneAndUpdate({ _id: item._id }, { vendor: savedNewVendor._id });

        updatedCompany.vendor = savedNewVendor._id






    
      
      const uploadedFiles = await FileModel.find({ userID: uid });

      sendBasicResponse(res, {
        approvalData: updatedCompany,
        generalRegistrationForm: {
          ...savedNewVendor._doc,
          files: uploadedFiles,
          vendorID: savedNewVendor._doc._id,
        },
        baseRegistrationForm: {
          ...savedNewVendor._doc,
          files: uploadedFiles,
        },
        
      });

      
    }







    console.log({vendorRegistrationForm});

    return
    

    

    // console.log({registrationForm});
  } catch (error) {
    next(error);
  }
};


const inviteHasExpired = (invite) => {
  if (invite.expiry._seconds) {
    const expiryDateTimestamp = invite.expiry._seconds * 1000;
    const currentDate = new Date();
    const currentDateTimestamp = currentDate.getTime();

    if (expiryDateTimestamp < currentDateTimestamp) {
      return true;
    } else {
      return false;
    }
  } else if (invite.expiry) {
    const expiryDate = new Date(invite.expiry);
    const expiryDateTimestamp = expiryDate.getTime();
    const currentDateTimestamp = currentDate.getTime();

    if (expiryDateTimestamp < currentDateTimestamp) {
      return true;
    } else {
      return false;
    }
  }
};
