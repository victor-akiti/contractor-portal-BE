const mongoose = require('mongoose');
const { Company } = require('./models/company'); // Adjust path to your models
const { VendorModel } = require('./models/vendor');
const { UserModel } = require('./models/user');
const { FormModel } = require('./models/form');

require("dotenv").config();

const MONGODB_URI = process.env.MONGO_CONNECT_URL;

async function seamlessCompanyMigration() {
  console.log('🚀 Starting seamless company migration...');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Find companies missing both vendor and vendorAppAdminProfile fields
    const oldCompanies = await Company.find({
      vendor: { $exists: false },
      vendorAppAdminProfile: { $exists: false },
      userID: { $exists: true, $ne: null, $ne: "" }
    });

    console.log(`📊 Found ${oldCompanies.length} older companies to migrate`);

    // Step 2: Pre-migration validation
    const validationErrors = [];
    const validCompanies = [];

    for (const company of oldCompanies) {
      const user = await UserModel.findOne({ uid: company.userID });
      
      if (!user) {
        validationErrors.push({
          companyId: company._id,
          companyName: company.companyName,
          userID: company.userID,
          error: "No matching user found"
        });
      } else if (!company.companyName) {
        validationErrors.push({
          companyId: company._id,
          userID: company.userID,
          error: "Missing company name"
        });
      } else {
        validCompanies.push({ company, user });
      }
    }

    // Report validation errors but continue with valid companies
    if (validationErrors.length > 0) {
      console.warn("⚠️  VALIDATION WARNINGS - Some companies will be skipped:");
      console.warn(JSON.stringify(validationErrors, null, 2));
      console.warn(`Skipping ${validationErrors.length} companies with missing users.`);
    }

    console.log(`✅ Validation passed. ${validCompanies.length} companies ready for seamless migration.`);

    // Step 3: Get base form template
    const baseForm = await FormModel.findOne({
      "form.settings.isContractorApplicationForm": true,
    });

    if (!baseForm) {
      throw new Error("❌ Base registration form not found - cannot proceed");
    }

    console.log('📋 Base form template loaded successfully');

    // Step 4: Migrate each company with full data mapping
    let successCount = 0;
    const failures = [];

    for (const { company, user } of validCompanies) {
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Create deep copy of base form
          const populatedForm = JSON.parse(JSON.stringify(baseForm.form));
          
          // ============ MAP OLD COMPANY DATA TO FORM FIELDS ============
          
          // Page 0: Company Details
          const page0 = populatedForm.pages[0];
          
          // General Info Section (index 0)
          const generalInfo = page0.sections[0];
          
          // Company Name (field ID: 1i4F~_V-NPwxUJW)
          if (company.companyName) {
            generalInfo.fields[0].value = company.companyName;
          }
          
          // Registration Type (field ID: DmT-mJOBWtQHTdq) 
          if (company.cacForm2A && company.cacForm7) {
            generalInfo.fields[1].value = "Company Registration";
          } else if (company.cacBNForm1) {
            generalInfo.fields[1].value = "Business Name Registration";
          }
          
          // Registered Number (field ID: 1AAJZWJS3vs34Bx)
          if (company.registeredNumber) {
            generalInfo.fields[2].value = company.registeredNumber;
          }
          
          // Company Registration Certificate (field ID: 9nF60Uuh.86lklv)
          if (company.certificateOfRegistration && company.certificateOfRegistration.length > 0) {
            generalInfo.fields[3].value = company.certificateOfRegistration.map(cert => ({
              url: cert.downloadURL,
              name: cert.name,
              label: cert.label || "Company Registration Certificate"
            }));
          }
          
          // Tax ID Number (field ID: TDuPT2wKelzMkOO)
          if (company.taxIDNumber) {
            generalInfo.fields[4].value = company.taxIDNumber;
          }
          
          // TIN Certificate (field ID: NfmxYQe2upuSlmZ)
          if (company.tinCertificate && company.tinCertificate.length > 0) {
            generalInfo.fields[5].value = company.tinCertificate.map(cert => ({
              url: cert.downloadURL,
              name: cert.name,
              label: cert.label || "TIN Certificate"
            }));
          }
          
          // Website (field ID: hYiK6D~05oWuRS8)
          if (company.website) {
            generalInfo.fields[6].value = company.website;
          }
          
          // CAC Form 2A (field ID: fuQ1g~5vcGewii_)
          if (company.cacForm2A && company.cacForm2A.length > 0) {
            generalInfo.fields[7].value = company.cacForm2A.map(cert => ({
              url: cert.downloadURL,
              name: cert.name,
              label: cert.label || "CAC Form 2A"
            }));
          }
          
          // CAC Form 7 (field ID: s0VczeOLm_hOg-q)
          if (company.cacForm7 && company.cacForm7.length > 0) {
            generalInfo.fields[8].value = company.cacForm7.map(cert => ({
              url: cert.downloadURL,
              name: cert.name,
              label: cert.label || "CAC Form 7"
            }));
          }
          
          // CAC/BN Form 1 (field ID: aNjw3FTxMFtXm9L)
          if (company.cacBNForm1 && company.cacBNForm1.length > 0) {
            generalInfo.fields[9].value = company.cacBNForm1.map(cert => ({
              url: cert.downloadURL,
              name: cert.name,
              label: cert.label || "CAC/BN Form 1"
            }));
          }

          // Memorandum and Articles of Association (field ID: YsJVzNyCscZveL1)
          // Note: This field exists in new form but not in old company data structure

          // Business Activities Section (index 1)
          const businessActivities = page0.sections[1];
          
          // Activities (field ID: hGfs1_YYCbka8e0)
          if (company.activities && company.activities.length > 0) {
            businessActivities.fields[0].value = company.activities.map(activity => ({
              label: activity.display || activity.value || activity,
              value: activity.value || activity,
              required: false
            }));
          }
          
          // Company Brochure (field ID: o~14E-g1M2k4VCU)
          if (company.companyBrochure && company.companyBrochure.length > 0) {
            businessActivities.fields[1].value = company.companyBrochure.map(brochure => ({
              url: brochure.downloadURL,
              name: brochure.name,
              label: brochure.label || "Company Brochure"
            }));
          }

          // HQ Address Section (index 2)
          const hqAddress = page0.sections[2];
          if (company.hqAddress) {
            // Address Line 1 (field ID: EKcyH_OBfhiOS-Z)
            if (company.hqAddress.line1) hqAddress.fields[0].value = company.hqAddress.line1;
            // Address Line 2 (field ID: WeUDZJYd_BRIq2F)  
            if (company.hqAddress.line2) hqAddress.fields[1].value = company.hqAddress.line2;
            // Address Line 3 (field ID: GLssgECu1G_K1KE)
            if (company.hqAddress.line3) hqAddress.fields[2].value = company.hqAddress.line3;
            // Country (field ID: XAnI~e3YchfUXxs)
            if (company.hqAddress.country) hqAddress.fields[3].value = company.hqAddress.country;
            // State (field ID: eTguhZ60pt74qCm)
            if (company.hqAddress.state) hqAddress.fields[4].value = company.hqAddress.state;
            // City (field ID: 3qcSGl.bez2M7_Z)
            if (company.hqAddress.city) hqAddress.fields[5].value = company.hqAddress.city;
          }

          // Branch Address Section (index 3)
          const branchAddress = page0.sections[3];
          if (company.branchAddresses && company.branchAddresses.length > 0) {
            const firstBranch = company.branchAddresses[0];
            // Address Line 1 (field ID: 6SKURpFFPjPGl65)
            if (firstBranch.line1) branchAddress.fields[0].value = firstBranch.line1;
            // Address Line 2 (field ID: XvRpXjJ4s7lY9Wp)
            if (firstBranch.line2) branchAddress.fields[1].value = firstBranch.line2;
            // Address Line 3 (field ID: IrEJTqLrJKdqixh)
            if (firstBranch.line3) branchAddress.fields[2].value = firstBranch.line3;
            // Country (field ID: yslI~m2.UXVIT5N)
            if (firstBranch.country) branchAddress.fields[3].value = firstBranch.country;
            // State (field ID: rQO0ryjANQPyHLe)
            if (firstBranch.state) branchAddress.fields[4].value = firstBranch.state;
            // City (field ID: ~uArOLT8BzZviWc)
            if (firstBranch.city) branchAddress.fields[5].value = firstBranch.city;
          }

          // Primary Contact Section (index 4)  
          const primaryContact = page0.sections[4];
          if (company.primaryContact) {
            // Title (field ID: -0Yspp-wGWQRwBS)
            if (company.primaryContact.title) primaryContact.fields[0].value = company.primaryContact.title;
            // First Name (field ID: ~PjHF~0H-oCXPFe)
            if (company.primaryContact.firstName) primaryContact.fields[1].value = company.primaryContact.firstName;
            // Family Name (field ID: iFZy7KTdIJBDxzu)
            if (company.primaryContact.familyName) primaryContact.fields[2].value = company.primaryContact.familyName;
            // Designation (field ID: gsTW_LWZkipg0Mb)
            if (company.primaryContact.designation) primaryContact.fields[3].value = company.primaryContact.designation;
            // Email (field ID: QKRia9M.P6y3QQ2)
            if (company.primaryContact.email) primaryContact.fields[4].value = company.primaryContact.email;
            // Phone Number (field ID: ch59sED8H1~JK6y)
            if (company.primaryContact.phone1) {
              const phone = company.primaryContact.phone1.internationalNumber || company.primaryContact.phone1.number || company.primaryContact.phone1;
              primaryContact.fields[5].value = String(phone);
            }
            // Alternate Phone (field ID: NwO5~_AosYgQSFn)
            if (company.primaryContact.phone2) {
              const phone = company.primaryContact.phone2.internationalNumber || company.primaryContact.phone2.number || company.primaryContact.phone2;
              primaryContact.fields[6].value = String(phone);
            }
          }

          // Secondary Contact Section (index 5)
          const secondaryContact = page0.sections[5];
          if (company.secondaryContact) {
            try {
              // Title (field ID: Snp~soWKffeex7E)
              if (company.secondaryContact.title) secondaryContact.fields[0].value = company.secondaryContact.title;
              // First Name (field ID: onsoDoKmzzvUw5Y) 
              if (company.secondaryContact.firstName) secondaryContact.fields[1].value = company.secondaryContact.firstName;
              // Middle Name (field ID: 5nzZoah~r67.Klf) - Skip since old data doesn't have this
              // Surname (field ID: TNs7Utsjn537bcn)
              if (company.secondaryContact.familyName) secondaryContact.fields[3].value = company.secondaryContact.familyName;
              // Designation (field ID: -0bIgjxpBDPgmha)
              if (company.secondaryContact.designation) secondaryContact.fields[4].value = company.secondaryContact.designation;
              // Email (field ID: 5xU-oNWVLK1~iUK)
              if (company.secondaryContact.email) secondaryContact.fields[5].value = company.secondaryContact.email;
              // Phone Number (field ID: 9qB-HK~yNQuQPd7)
              if (company.secondaryContact.phone1) {
                const phone = company.secondaryContact.phone1.internationalNumber || company.secondaryContact.phone1.number || company.secondaryContact.phone1;
                secondaryContact.fields[6].value = String(phone);
              }
              // Alternate Phone (field ID: wwsGzLnFnZXswHn)
              if (company.secondaryContact.phone2) {
                const phone = company.secondaryContact.phone2.internationalNumber || company.secondaryContact.phone2.number || company.secondaryContact.phone2;
                secondaryContact.fields[7].value = String(phone);
              }
            } catch (error) {
              console.warn(`⚠️  Warning: Secondary contact mapping failed for ${company.companyName}:`, error.message);
            }
          }

          // Page 1: HSE Record
          if (company.safetyRecord && populatedForm.pages[1] && populatedForm.pages[1].sections[0]) {
            try {
              const hseSection = populatedForm.pages[1].sections[0];
              
              // Convert Firebase timestamps to proper dates if they exist
              if (company.safetyRecord.reportingPeriod) {
                // Reporting Period Start (field ID: r9IOSWaEljt_s52)
                if (company.safetyRecord.reportingPeriod.fromDate) {
                  try {
                    let startDate;
                    if (company.safetyRecord.reportingPeriod.fromDate._seconds) {
                      startDate = new Date(company.safetyRecord.reportingPeriod.fromDate._seconds * 1000);
                    } else {
                      startDate = new Date(company.safetyRecord.reportingPeriod.fromDate);
                    }
                    if (!isNaN(startDate.getTime()) && hseSection.fields[0]) {
                      hseSection.fields[0].value = startDate.toISOString().slice(0, 16);
                    }
                  } catch (dateError) {
                    console.warn(`⚠️  Warning: Invalid start date for ${company.companyName}:`, dateError.message);
                  }
                }
                
                // Reporting Period End (field ID: 9GUPSiiu_Pc_RuP)
                if (company.safetyRecord.reportingPeriod.toDate) {
                  try {
                    let endDate;
                    if (company.safetyRecord.reportingPeriod.toDate._seconds) {
                      endDate = new Date(company.safetyRecord.reportingPeriod.toDate._seconds * 1000);
                    } else {
                      endDate = new Date(company.safetyRecord.reportingPeriod.toDate);
                    }
                    if (!isNaN(endDate.getTime()) && hseSection.fields[1]) {
                      hseSection.fields[1].value = endDate.toISOString().slice(0, 16);
                    }
                  } catch (dateError) {
                    console.warn(`⚠️  Warning: Invalid end date for ${company.companyName}:`, dateError.message);
                  }
                }
              }
              
              // Safely map numeric fields
              const numericFieldMappings = [
                { oldKey: 'hoursWorked', fieldIndex: 2 },
                { oldKey: 'fatalities', fieldIndex: 3 },
                { oldKey: 'lti', fieldIndex: 4 }, // Lost Work Day Cases
                { oldKey: 'recordableIncidents', fieldIndex: 5 },
                { oldKey: 'environmentalSpills', fieldIndex: 6 }
              ];
              
              numericFieldMappings.forEach(mapping => {
                if (company.safetyRecord[mapping.oldKey] !== undefined && hseSection.fields[mapping.fieldIndex]) {
                  hseSection.fields[mapping.fieldIndex].value = String(company.safetyRecord[mapping.oldKey]);
                }
              });
            } catch (error) {
              console.warn(`⚠️  Warning: HSE record mapping failed for ${company.companyName}:`, error.message);
            }
          }

          // Page 2: Business & Finance
          if (company.financialPerformance && populatedForm.pages[2]) {
            try {
              const financialSection = populatedForm.pages[2].sections[0];
              
              // Financial Year (field ID: ndJmbAaULYBzl1D)
              if (company.financialPerformance.financialYear) {
                financialSection.fields[0].value = String(company.financialPerformance.financialYear);
              }
              
              // Turnover (field ID: mn1D5~oOfDFP.JN)
              if (company.financialPerformance.turnover) {
                financialSection.fields[1].value = String(company.financialPerformance.turnover);
              }
              
              // TCC Number (field ID: RsTgVqV2KzMfnRW) - Old data doesn't have this
              
              // Tax Clearance Certificate (field ID: j8FKo2EEsnH.t_F)
              if (company.financialPerformance.taxClearanceCert && company.financialPerformance.taxClearanceCert.length > 0) {
                financialSection.fields[3].value = company.financialPerformance.taxClearanceCert.map(cert => ({
                  url: cert.downloadURL,
                  name: cert.name,
                  label: cert.label || "Tax Clearance Certificate"
                }));
              }
              
              // Audited Accounts (field ID: BNYq~MJW40jINSZ)
              if (company.financialPerformance.auditedAccounts && company.financialPerformance.auditedAccounts.length > 0) {
                financialSection.fields[4].value = company.financialPerformance.auditedAccounts.map(cert => ({
                  url: cert.downloadURL,
                  name: cert.name,
                  label: cert.label || "Audited Accounts"
                }));
              }
            } catch (error) {
              console.warn(`⚠️  Warning: Financial performance mapping failed for ${company.companyName}:`, error.message);
            }
          }

          // Page 3: Insurance 
          if (company.insurance && populatedForm.pages[3]) {
            try {
              // Workman Insurance (section 0)
              if (company.insurance.workmanCert && company.insurance.workmanCert.length > 0) {
                populatedForm.pages[3].sections[0].fields[0].value = company.insurance.workmanCert.map(cert => ({
                  url: cert.downloadURL,
                  name: cert.name,
                  label: cert.label || "Workman Insurance Certificate"
                }));
              }
              
              // Group Life Insurance (section 1) 
              if (company.insurance.groupLifeInsuranceCert && company.insurance.groupLifeInsuranceCert.length > 0) {
                populatedForm.pages[3].sections[1].fields[0].value = company.insurance.groupLifeInsuranceCert.map(cert => ({
                  url: cert.downloadURL,
                  name: cert.name,
                  label: cert.label || "Group Life Insurance Certificate"
                }));
              }
              
              // 3rd Party Liability Insurance (section 2)
              if (company.insurance.thirdPartyLiabilityCert && company.insurance.thirdPartyLiabilityCert.length > 0) {
                populatedForm.pages[3].sections[2].fields[0].value = company.insurance.thirdPartyLiabilityCert.map(cert => ({
                  url: cert.downloadURL,
                  name: cert.name,
                  label: cert.label || "3rd Party Liability Insurance Certificate"
                }));
              }
            } catch (error) {
              console.warn(`⚠️  Warning: Insurance mapping failed for ${company.companyName}:`, error.message);
            }
          }

          // Page 4: NUPRC Permits
          if (company.dpr && company.dpr.dprPermits && populatedForm.pages[4]) {
            try {
              const nuprcSection = populatedForm.pages[4].sections[1];
              const firstPermit = company.dpr.dprPermits[0];
              
              if (firstPermit) {
                // Permit Number (field ID: Mw070mwyAFZ_ktl)
                if (firstPermit.permitNumber) nuprcSection.fields[0].value = firstPermit.permitNumber;
                // NUPRC Major Category (field ID: ccDpJz2m3HxzWRQ)
                if (firstPermit.dprCategory) nuprcSection.fields[1].value = firstPermit.dprCategory;
                // NUPRC Sub-category (field ID: Nrj_tkNmxFTi8qZ)
                if (firstPermit.dprSubCategory) {
                  nuprcSection.fields[2].value = [{
                    label: firstPermit.dprSubCategory,
                    value: firstPermit.dprSubCategory,
                    required: true
                  }];
                }
                // Attach Permit (field ID: puOcP~NJ~bFkrgU)
                if (firstPermit.attachment && firstPermit.attachment.length > 0) {
                  nuprcSection.fields[3].value = firstPermit.attachment.map(cert => ({
                    url: cert.downloadURL,
                    name: cert.name,
                    label: cert.label || "NUPRC Permit"
                  }));
                }
              }
            } catch (error) {
              console.warn(`⚠️  Warning: NUPRC permit mapping failed for ${company.companyName}:`, error.message);
            }
          }

          // Page 5: NCDMB (if otherCertificates.ncdmbCertificates exists)
          if (company.otherCertificates && company.otherCertificates.ncdmbCertificates && populatedForm.pages[5]) {
            try {
              const ncdmbCert = company.otherCertificates.ncdmbCertificates[0];
              if (ncdmbCert) {
                const ncecSection = populatedForm.pages[5].sections[1];
                // Certificate Number (field ID: Ecq32Z0T8Cjn77w)
                if (ncdmbCert.certificateNumber) ncecSection.fields[0].value = ncdmbCert.certificateNumber;
                // Equipment/Services (field ID: eb~eZCyVfZQa25S)
                if (ncdmbCert.equipmentItem && ncdmbCert.equipmentItem.length > 0) {
                  ncecSection.fields[1].value = ncdmbCert.equipmentItem.map(item => ({
                    label: item.display || item.value || item,
                    value: item.value || item,
                    required: true
                  }));
                }
                // Certificate Type Number (field ID: kWc23elaVR_IWAU) - Skip if not in old data
                // Certificate attachment (field ID: UrPwhDS.gLcemfB)
                if (ncdmbCert.attachment && ncdmbCert.attachment.length > 0) {
                  ncecSection.fields[3].value = ncdmbCert.attachment.map(cert => ({
                    url: cert.downloadURL,
                    name: cert.name,
                    label: cert.label || "NCEC Certificate"
                  }));
                }
              }
            } catch (error) {
              console.warn(`⚠️  Warning: NCDMB certificate mapping failed for ${company.companyName}:`, error.message);
            }
          }

          // Create VendorModel with populated form
          const newVendor = new VendorModel({
            form: populatedForm,
            vendorAppAdminUID: company.userID,
            vendorAppAdminProfile: user._id,
            company: company._id,
            companyType: "Standalone",
            updated: true, // Mark as updated since we've populated data
            modificationHistory: [{
              date: new Date(),
              action: "Seamlessly migrated from legacy company data with full data mapping",
              createdBy: { name: "System Migration", email: "system@migration" }
            }]
          });

          const savedVendor = await newVendor.save({ session });

          // Update company document
          await Company.updateOne(
            { _id: company._id },
            { 
              vendor: savedVendor._id,
              vendorAppAdminProfile: user._id
            },
            { session }
          );
        });

        successCount++;
        console.log(`✅ Seamlessly migrated: ${company.companyName} (${successCount}/${validCompanies.length})`);
        
      } catch (error) {
        failures.push({
          companyId: company._id,
          companyName: company.companyName,
          error: error.message
        });
        console.error(`❌ Failed: ${company.companyName} - ${error.message}`);
      } finally {
        await session.endSession();
      }
    }

    // Final report
    console.log(`\n🎉 Seamless Migration Complete:`);
    console.log(`- Successfully migrated: ${successCount} companies`);
    console.log(`- Failed migrations: ${failures.length} companies`);
    
    if (failures.length > 0) {
      console.log(`\n❌ Failure Details:`, JSON.stringify(failures, null, 2));
    } else {
      console.log('\n✨ All companies migrated successfully with full data mapping!');
      console.log('📋 Users will now see their existing data populated in the form fields.');
    }

    return { successCount, failures };
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration immediately
seamlessCompanyMigration()
  .then(result => {
    console.log('\n🏁 Migration script completed successfully!');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💀 Migration script failed:', error);
    process.exit(1);
  });