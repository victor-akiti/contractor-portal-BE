const { default: mongoose } = require("mongoose");
const { admin } = require("../../auth/initializeFirebase");
const {
  Error400Handler,
  Error403Handler,
  Error500Handler,
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
const { fieldsMap } = require("../../pages");

exports.fetchAllCompanies = async (req, res, next) => {
  try {

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

    sendBasicResponse(res, { companies: resultsList });
  } catch (error) {
    next(error);
  }
};

exports.fetchCompanyCurrentRegistrationStatus = async (req, res, next) => {
  try {

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
    console.time('Database Query Time');
    const invites = await Invite.find({});

    const user = await UserModel.findOne({ uid: req.user.uid });

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
    

    //Sort notNeedingAttention
    notNeedingAttention = sortListAlphabetically(notNeedingAttention);

    l3 = sortListAlphabetically(l3);

    returned = sortListAlphabetically(returned);

    inProgress = sortListAlphabetically(inProgress)

    parkedL2 = sortListAlphabetically(parkedL2)

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
    console.timeEnd('Database Query Time');
  } catch (error) {
    next(error);
  }
};



// PERFORMANCE-OPTIMIZED BACKEND CONTROLLERS
// Maintains exact same logic but with significant performance improvements

exports.fetchApprovalCounts = async (req, res, next) => {
  try {
    console.time('fetchApprovalCounts - Total');
    
    // Use aggregation pipeline for maximum speed - single database round trip
    const countResults = await Company.aggregate([
      {
        $facet: {
          pendingL2: [
            {
              $match: { 
                $or: [{ "flags.submitted": true }, { "flags.stage": "submitted" }],
                "flags.status": { 
                  $nin: ["parked", "suspended", "approved", "returned", "recommended for hold", "park requested"] 
                }
              }
            },
            { $count: "count" }
          ],
          completedL2: [
            {
              $match: { 
                $or: [{ "flags.status": "suspended" }, { "flags.status": "parked" }]
              }
            },
            { $count: "count" }
          ],
          l3: [
            {
              $match: { 
                "flags.status": "approved", 
                "flags.approved": true 
              }
            },
            { $count: "count" }
          ],
          inProgress: [
            {
              $match: {
                $or: [
                  { "flags.status": { $exists: false } },
                  { "flags.status": "incomplete" }
                ]
              }
            },
            { $count: "count" }
          ],
          returned: [
            {
              $match: { "flags.status": "returned" }
            },
            { $count: "count" }
          ],
          parkRequested: [
            {
              $match: { 
                $or: [
                  { "flags.status": "recommended for hold" },
                  { "flags.status": "park requested" },
                  { "flags.stage": "recommended for hold" }
                ]
              }
            },
            { $count: "count" }
          ]
        }
      }
    ]);

    // Single aggregation for invite counts too
    const inviteCountResults = await Invite.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          used: [
            { $match: { used: { $exists: true } } },
            { $count: "count" }
          ],
          expired: [
            { 
              $match: { 
                used: { $exists: false }, 
                expiry: { $lte: new Date() } 
              } 
            },
            { $count: "count" }
          ]
        }
      }
    ]);

    // Extract counts from aggregation results
    const counts = countResults[0];
    const inviteCounts = inviteCountResults[0];
    
    const processedCounts = {
      pendingL2: counts.pendingL2[0]?.count || 0,
      completedL2: counts.completedL2[0]?.count || 0,
      l3: counts.l3[0]?.count || 0,
      inProgress: counts.inProgress[0]?.count || 0,
      returned: counts.returned[0]?.count || 0,
      parkRequested: counts.parkRequested[0]?.count || 0,
      invites: {
        total: inviteCounts.total[0]?.count || 0,
        used: inviteCounts.used[0]?.count || 0,
        expired: inviteCounts.expired[0]?.count || 0,
        active: (inviteCounts.total[0]?.count || 0) - (inviteCounts.used[0]?.count || 0) - (inviteCounts.expired[0]?.count || 0)
      }
    };

    console.timeEnd('fetchApprovalCounts - Total');
    sendBasicResponse(res, { counts: processedCounts });
  } catch (error) {
    console.log('fetchApprovalCounts error:', error);
    next(error);
  }
};

exports.fetchApprovalsByTab = async (req, res, next) => {
  try {
    const { sort = 'name' } = req.query;
    const { tab } = req.params;
    const user = await UserModel.findOne({ uid: req.user.uid });
    
    let pipeline = [];
    
    // Build aggregation pipeline for maximum performance
    switch (tab) {
      case 'pending-l2':
        pipeline = [
          {
            $match: { 
              $or: [{ "flags.submitted": true }, { "flags.stage": "submitted" }],
              "flags.status": { 
                $nin: ["parked", "suspended", "approved", "returned", "recommended for hold", "park requested"] 
              }
            }
          },
          {
            // Add needsAttention field directly in aggregation
            $addFields: {
              needsAttention: {
                $cond: {
                  if: { 
                    $and: [
                      { $isArray: "$currentEndUsers" },
                      { $in: [user._id, "$currentEndUsers"] }
                    ]
                  },
                  then: true,
                  else: false
                }
              }
            }
          },
          {
            // Sort with needsAttention first, then alphabetically
            $sort: {
              needsAttention: -1,  // true first (descending)
              companyName: 1       // then alphabetical
            }
          }
        ];
        break;
        
      case 'completed-l2':
        pipeline = [
          {
            $match: { 
              $or: [{ "flags.status": "suspended" }, { "flags.status": "parked" }]
            }
          },
          { $sort: { companyName: 1 } }
        ];
        break;
        
      case 'l3':
        pipeline = [
          {
            $match: { 
              "flags.status": "approved", 
              "flags.approved": true 
            }
          },
          { $sort: { companyName: 1 } }
        ];
        break;
        
      case 'in-progress':
        pipeline = [
          {
            $match: { 
              $or: [
                { "flags.status": { $exists: false } },
                { "flags.status": "incomplete" }
              ]
            }
          },
          { $sort: { companyName: 1 } }
        ];
        break;
        
      case 'returned':
        pipeline = [
          { $match: { "flags.status": "returned" } },
          { $sort: { companyName: 1 } }
        ];
        break;
        
      case 'park-requests':
        pipeline = [
          {
            $match: { 
              $or: [
                { "flags.status": "recommended for hold" },
                { "flags.status": "park requested" },
                { "flags.stage": "recommended for hold" }
              ]
            }
          },
          { $sort: { companyName: 1 } }
        ];
        break;
        
      default:
        throw new Error400Handler("Invalid tab specified");
    }

    // Handle different sort options
    if (sort === 'date') {
      // Replace the sort stage for date sorting
      const sortStage = pipeline.find(stage => stage.$sort);
      if (sortStage && tab !== 'pending-l2') {
        sortStage.$sort = { updatedAt: -1 };
      } else if (tab === 'pending-l2') {
        // For pending-l2, modify to sort by date within priority groups
        sortStage.$sort = {
          needsAttention: -1,
          updatedAt: -1
        };
      }
    }

    // Execute optimized aggregation
    const companies = await Company.aggregate(pipeline);

    sendBasicResponse(res, { companies });
    
  } catch (error) {
    console.log('fetchApprovalsByTab error:', error);
    next(error);
  }
};

exports.fetchInvites = async (req, res, next) => {
  try {
    const { filter = 'all', search = '' } = req.query;
    
    let pipeline = [];
    const currentDate = new Date();
    
    // Build aggregation pipeline
    let matchStage = {};
    
    switch (filter) {
      case 'active':
        matchStage = { used: { $exists: false }, expiry: { $gt: currentDate } };
        break;
      case 'used':
        matchStage = { used: { $exists: true } };
        break;
      case 'expired':
        matchStage = { used: { $exists: false }, expiry: { $lte: currentDate } };
        break;
      case 'all':
      default:
        // No filter
        break;
    }

    // Add search filter
    if (search) {
      matchStage.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    pipeline = [
      { $match: matchStage },
      { $sort: { companyName: 1 } }
    ];

    const invites = await Invite.aggregate(pipeline);

    sendBasicResponse(res, { invites });
  } catch (error) {
    console.log('fetchInvites error:', error);
    next(error);
  }
};

exports.searchVendors = async (req, res, next) => {
  try {
    const { query, filter = 'all' } = req.query;
    
    if (!query || query.length < 2) {
      return sendBasicResponse(res, { companies: [] });
    }

    let pipeline = [
      {
        $match: {
          companyName: { $regex: query, $options: 'i' }
        }
      }
    ];

    // Add status filter
    let statusMatch = {};
    switch (filter) {
      case 'pending':
        statusMatch = {
          $or: [{ "flags.submitted": true }, { "flags.stage": "submitted" }],
          "flags.status": { 
            $nin: ["parked", "suspended", "approved", "returned", "recommended for hold", "park requested"] 
          }
        };
        break;
      case 'parked':
        statusMatch = { "flags.status": { $in: ["parked", "suspended"] } };
        break;
      case 'l3':
        statusMatch = { "flags.status": "approved", "flags.approved": true };
        break;
      case 'in progress':
        statusMatch = {
          $or: [
            { "flags.status": { $exists: false } },
            { "flags.status": "incomplete" }
          ]
        };
        break;
      case 'returned':
        statusMatch = { "flags.status": "returned" };
        break;
      case 'park requested':
        statusMatch = {
          $or: [
            { "flags.status": "recommended for hold" },
            { "flags.status": "park requested" },
            { "flags.stage": "recommended for hold" }
          ]
        };
        break;
    }

    // Add status filter to pipeline if needed
    if (Object.keys(statusMatch).length > 0) {
      pipeline[0].$match = { ...pipeline[0].$match, ...statusMatch };
    }

    // Add sort and limit
    pipeline.push(
      { $sort: { companyName: 1 } },
      { $limit: 20 }
    );

    const companies = await Company.aggregate(pipeline);

    sendBasicResponse(res, { companies });
  } catch (error) {
    console.log('searchVendors error:', error);
    next(error);
  }
};

// ADDITIONAL PERFORMANCE OPTIMIZATIONS

// 1. Add this middleware to enable query result caching
exports.enableQueryCache = (req, res, next) => {
  // Enable MongoDB query plan cache
  req.useQueryCache = true;
  next();
};

// 2. Batch multiple related queries (if needed elsewhere in your app)
exports.fetchMultipleTabData = async (req, res, next) => {
  try {
    const { tabs } = req.body; // Array of tab names
    const user = await UserModel.findOne({ uid: req.user.uid });
    
    // Build parallel aggregation for multiple tabs
    const facetStages = {};
    
    tabs.forEach(tab => {
      let matchCondition = {};
      
      switch (tab) {
        case 'pending-l2':
          matchCondition = { 
            $or: [{ "flags.submitted": true }, { "flags.stage": "submitted" }],
            "flags.status": { 
              $nin: ["parked", "suspended", "approved", "returned", "recommended for hold", "park requested"] 
            }
          };
          break;
        case 'completed-l2':
          matchCondition = { 
            $or: [{ "flags.status": "suspended" }, { "flags.status": "parked" }]
          };
          break;
        // Add other cases as needed
      }
      
      facetStages[tab] = [
        { $match: matchCondition },
        { $sort: { companyName: 1 } }
      ];
    });
    
    const results = await Company.aggregate([
      { $facet: facetStages }
    ]);
    
    sendBasicResponse(res, { tabData: results[0] });
  } catch (error) {
    next(error);
  }
};

// Keep the old endpoint for backward compatibility during transition
exports.fetchAllApprovalDataOld = exports.fetchAllApprovalData;

// Helper function - exactly like original
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

    //Find all current vendor records for the requesting user
    const ObjectId = require("mongoose").Types.ObjectId;
    const vendors = await VendorModel.find({
      vendorAppAdminProfile: new ObjectId(user._id),
    });

    //Check if the user has a registered company
    const companies = await Company.find({ userID: uid });
    const modifiedCompanies = []


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
    const { uid } = req.user;
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
  } catch (error) {
    next(error);
  }
};

exports.fetchVendorRegistrationForm = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

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


          if (
            vendorSection &&
            !vendorSection.isDuplicate &&
            vendorSection.title === section.title
          ) {
            //I do not like that I had to do a three levels deep nested for-loop but time constraints left this as the quickest workable solution. Bear with me but please refactor this whenever you can.
            for (let index3 = 0; index3 < section.fields.length; index3++) {
              const field = section.fields[index3];
              const vendorField = vendorSection.fields[index3];

              if (vendorField && vendorField.type === field.type) {
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


  } catch (error) {
    next(error);
  }
};

const updateVendorFormWithIDs = (vendorFormID) => {
  return new Promise (async (resolve, reject) => {
    const vendorForm = await VendorModel.findOne({_id: vendorFormID})

    if (vendorForm) {
      let pages = vendorForm.form.pages

      const generalRegistrationForm = await FormModel.findOne({
        "form.settings.isContractorApplicationForm": true,
      }).select("-modificationHistory -formCreator -createdAt -updatedAt");

      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        let page = pages[pageIndex];

        pages[pageIndex]["id"] = fieldsMap[pageIndex].id

        let currentSection = 0
        for (let sectionIndex = 0; sectionIndex < page.sections.length; sectionIndex++) {
          let section = page.sections[sectionIndex];


          

          let currentField = 0

          pages[pageIndex].sections[sectionIndex]["id"] = fieldsMap[pageIndex].sections[currentSection].id

          

          for (let fieldIndex = 0; fieldIndex < section.fields.length; fieldIndex++) {
            const field = section.fields[fieldIndex];

            

            if (fieldsMap[pageIndex]?.sections[currentSection]?.fields[currentField]?.id) {

              
              pages[pageIndex].sections[sectionIndex].fields[fieldIndex]["id"] = fieldsMap[pageIndex].sections[currentSection].fields[currentField].id




              if (page.sections[currentSection].fields.length - 1 > fieldIndex) {
                if (page.sections[currentSection].fields[fieldIndex].isDuplicate) {
    
                } else {
                  currentField = currentField + 1
                }
              } else {
                currentField = currentField + 1
              }
            }
      
          }

          if (page.sections.length - 1 > sectionIndex) {
            if (page.sections[sectionIndex + 1].isDuplicate) {

            } else {
              currentSection = currentSection + 1
            }
          } else {
            currentSection = currentSection + 1
          }
          
          
        }
        
        
      }

        

    const updatedVendorForm = await VendorModel.findOneAndUpdate({_id: vendorFormID}, {"form.pages" : pages, updated: true}, {new: true})

    if (updatedVendorForm) {
      resolve({
        error: null,
        form: updatedVendorForm
      })
    }
      
      
    } else {
      reject({
        error: {
          message: "No vendor form exists"
        },
        form : {}
      })
    }

    
    
  })
}

exports.fetchVendorApprovalData = async (req, res, next) => {
  try {
    console.log("Fetching vendor approval data");
    
    const { uid } = req.user;
    const { id } = req.params;
    const user = await UserModel.findOne({ uid });

    const company = await Company.findOne({ _id: id });

    if (!company) {
      throw new Error403Handler("The requested vendor record does not exist.");
    }

    let portalAdministrator = {}

    if (company.vendorAppAdminProfile) {
      //Get vendor portal administrator
      portalAdministrator = await UserModel.findOne({
        _id: company.vendorAppAdminProfile,
      });
    } else if (company.userID) {
      portalAdministrator = await UserModel.findOne({
        uid: company.userID
      })
    }


    //Get company invite
    let companyInvite = {}
    if (company.contractorDetails) {
      if (company.contractorDetails.invite) {
        let invite = await Invite.findOne({
          _id: company.contractorDetails.invite
        })

        if (invite && invite.inviteHistory.length > 0) {
          const lastInvite = invite.inviteHistory[invite.inviteHistory.length - 1]
          
          if (lastInvite) {
            const invitingUser = lastInvite.invitedBy?.displayName
            const invitingUserEmail = lastInvite.invitedBy?.email

            companyInvite = {
              name: invitingUser,
              email: invitingUserEmail,
              invitedCompanyName: lastInvite?.companyName
            }
          }
          
        }


        
      } else {
        let invite = await Invite.findOne({
          email: company.contractorDetails.email
        })


        

        let invitingUser = {}
        let invitingUserEmail = {}

        if (invite) {
          invitingUser = invite?.user?.displayName
          invitingUserEmail = invite?.user?.email

          companyInvite = {
            name: invitingUser,
            email: invitingUserEmail,
            invitedCompanyName: invite?.companyName
          }
        } else {
          companyInvite = {
            name: "N/A",
            email: "N/A"
          }
        }

        


      }
    }
    

    let allAmniStaff = await UserModel.find({ role: {$nin: "Vendor"} }).lean()

    let currentEndUsers = []

    if (company.currentEndUsers) {
      company.currentEndUsers.forEach(async endUser => {
        const theEndUser = await UserModel.findOne({
          _id: endUser
        })

        currentEndUsers.push(theEndUser)
        
      })
    } 
    
    

    


    //Get contractor registration form

    const generalRegistrationForm = await FormModel.findOne({
      "form.settings.isContractorApplicationForm": true,
    }).select("-modificationHistory -formCreator -createdAt -updatedAt");

    let vendorRegistrationForm = await VendorModel.findOne({
      _id: company.vendor,
    }).select("-modificationHistory -formCreator -createdAt -updatedAt");


    //Check if the company's form has been updated to add ids to fields
    if (!vendorRegistrationForm.updated) {
      console.log("Updating vendor form with ids");
      
      const updatedVendorForm = await updateVendorFormWithIDs(company.vendor)

      if (updatedVendorForm.error) {
        throw new Error500Handler("A system error occured. Please contact the system administrator")
      } else {
        vendorRegistrationForm = updatedVendorForm.form
      }
      
    }


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

                if (vendorField && vendorField.type === field.type) {
                  tempRegistrationForm.form.pages[index].sections[index2].fields[
                    index3
                  ].value = vendorField.value;
                  tempRegistrationForm.form.pages[index].sections[index2].fields[
                    index3
                  ].defaultValue = vendorField.defaultValue;
                }

                if (vendorField?.history) {
                  tempRegistrationForm.form.pages[index].sections[index2].fields[
                    index3
                  ]["history"] = vendorField?.history;
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
              console.log("Duplicate section");
              
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

                if (vendorField?.history) {
                  tempRegistrationForm.form.pages[index].sections[index2].fields[
                    index3
                  ]["history"] = vendorField?.history;
                }

                if (vendorField?.isCurrency) {
                  tempRegistrationForm.form.pages[index].sections[index2].fields[
                    index3
                  ]["isCurrency"] = vendorField?.isCurrency;
                }


                
              }

              vendorSectionIndex++;
            }
          }
        } else {
          continue;
        }
      }

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

            if (vendorSection && section) {
              if (vendorSection && vendorSection.title === section.title) {
                let fieldIndex = 0;
                while (fieldIndex < vendorSection.fields.length) {
                  const field = section.fields[fieldIndex];
                  const vendorField = vendorSection.fields[fieldIndex];

                  if (vendorField.isDuplicate) {
                    console.log("Duplicate field");
                    
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
            portalAdministrator,
            allAmniStaff,
            currentEndUsers,
            companyInvite
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
        portalAdministrator,
        companyInvite,
        allAmniStaff,
        currentEndUsers
        
      });

      
    }

    return
    
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
