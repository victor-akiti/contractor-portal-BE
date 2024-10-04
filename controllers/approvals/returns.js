const { returnApplicationToVendorEmailTemplate, returnApplicationToVendorEmailApproverTemplate } = require("../../helpers/emailTemplates");
const { createNewEvent } = require("../../helpers/eventHelpers");
const { sendMail } = require("../../helpers/mailer");
const { sendBasicResponse } = require("../../helpers/response");
const { Company } = require("../../models/company");
const { VendorModel } = require("../../models/vendor");

exports.returnApplicationToVendor = async (req, res, next) => {
    try {
        console.log(req.body);
        console.log(req.params);
        console.log(req.user);
        
        
        const { vendorID } = req.params

        const remarks = getRemarksTextAndHTML(req.body.newRemarks)

        console.log({remarks});
        


        if (!vendorID) {
            throw new Error400Handler("Vendor ID is required")
        }

        // Check if vendor exists
        const vendor = await Company.findOne({vendor: vendorID}).populate("vendorAppAdminProfile")

        if (!vendor) {
            throw new Error400Handler("Vendor does not exist")
        }

        console.log({vendor});
        
        //Update vendor flags stage to returned
        const updatedApplication = await Company.findOneAndUpdate({vendor: vendorID}, {
            flags: {
                ...vendor.flags, stage: "returned"}
        }, {
            new: true
        })

        //Save updated vendor form
        const savedVendorForm = await VendorModel.findOneAndUpdate({_id: vendorID}, {"form.pages": req.body.pages}, {
            new: true
        })

        //Get the CnP HOD and GM emails to add as bcc

        const sendReturnEmail = await sendMail({
            to: vendor.vendorAppAdminProfile.email,
            // bcc: req.user.email,
            subject: `Amni Contractor Registration for ${vendor.companyName}  - Issues`,
            html: returnApplicationToVendorEmailTemplate({
                name: vendor.vendorAppAdminProfile.name,
                companyName: vendor.companyName,
                vendorID,
                issuesHTML: remarks.issuesHtml,

            }).html,
            text: returnApplicationToVendorEmailTemplate({
                name: vendor.vendorAppAdminProfile.name,
                companyName: vendor.companyName,
                vendorID,
                issuesText: remarks.issuesText
            }).text
        })

        const sendApproverEmail = await sendMail({
            to: req.user.email,
            // bcc: req.user.email,
            subject: `Amni Contractor Registration for ${vendor.companyName}  - Issues`,
            html: returnApplicationToVendorEmailApproverTemplate({
                name: req.user.name,
                companyName: vendor.companyName,
                vendorID,
                issuesHTML: remarks.issuesHtml,

            }).html,
            text: returnApplicationToVendorEmailApproverTemplate({
                name: req.user.name,
                companyName: vendor.companyName,
                vendorID,
                issuesText: remarks.issuesText
            }).text
        })
  
        if (sendReturnEmail[0].statusCode === 202 || sendReturnEmail[0].statusCode === "202") {
            //Create event
            sendBasicResponse(res, {})
        }

        //Create event
        createNewEvent(req.user._id, req.user.name, req.user.role, vendorID, vendor.companyName, 1, req.body.newRemarks)

        console.log({savedVendorForm});
        
        
    } catch (error) {
        next(error)
    }
}

const getRemarksTextAndHTML = (issues) => {
    let issuesHtml = '<ul>';
    let issuesText = '';

    console.log('Issues', issues);

    for (let index = 0; index < Object.entries(issues).length; index++) {
        const element = Object.entries(issues)[index];
        let remark;

        if (Object.entries(element[1]).length > 0) {
            for (let index2 = 0; index2 < Object.entries(element[1]).length; index2++) {
                const section = Object.entries(element[1])[index2];

                remark = section[1][0].remark;
                issuesHtml +=
                    '<li>' +
                    `<div>Path: ${element[0]} -> ${section[0]}</div>
                    <div>Remarks: ${section[1][0].remark}</div>` +
                    '</li>';

                issuesText += '/ Path:' + `${element[0]} -> ${section[0]}` + '| Remark: ' + remark + ' /';
                        
            }
        }
        
    }

    issuesHtml += '</ul>';


    

    return { issuesHtml: issuesHtml, issuesText: issuesText };

    Object.entries(issues).forEach((iss, pageIndex) => {
      console.log('Issue', iss);

      let remark;

      if (Object.entries(iss[1]).length > 0) {
        Object.entries(iss[1]).forEach((r, index) => {
            console.log({r});
            
          remark = r[1][0].remark;
          issuesHtml +=
            '<li>' +
            `<div>Path: ${iss[0]} -> ${r[0]}</div>
             <div>Remarks: ${r[1][0].remark}</div>` +
            '</li>';

          issuesText += '/ Path:' + `${iss[0]} -> ${r[0]}` + '| Remark: ' + remark + ' /';
        });
      } else {
        remark = 'N/A';
      }
    });

    issuesHtml += '</ul>';

    return { issuesHtml: issuesHtml, issuesText: issuesText };
  }