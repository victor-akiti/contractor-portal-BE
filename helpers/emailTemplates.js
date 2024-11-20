const registrationInviteEmailTemplate = ({fname, link, expiry}) => {
    return {
        html : `

        <p>Dear ${fname}, </p>
        <p>You have been invited to provide details of your company on Amni's Contractor Registration Portal.</p>
        <p> Please note that use of the Portal is subject to the terms and conditions which are shown on the sign up page and in the Portal.</p>
        <p> Your sign-up link is <a href="${link}" >${link}</a>.<p>
        <p> Please follow the link to provide details of your company on the Portal.<p>
        <p> This link will expire ${expiry} days from the day this email was sent.</p>
    
        <p>If you do not wish to provide details of your company on Amni's Portal then please ignore this e-mail.</p>
    
        <p>
        Sincerely,<br>
        <i>Contracts & Procurement team,</i><br>
        Amni International Petroleum Development Company Ltd
        </p>
    
    
        `,
        text: `

        Dear ${fname},
        You have been invited to provide details of your company on Amni's Contractor Portal.
        Please note that use of the Portal is subject to the terms and conditions which are shown on the sign up page and in the Portal.
        Your sign-up link is ${link}
        Please follow the link to provide details of your company on the Portal.
        This link will expire ${expiry} days from the day this email was sent.
    
        If you do not wish to provide details of your company on Amni's Portal then please ignore this e-mail.
    
    
        Contracts & Procurement Team,
        Amni International Petroleum Development Company Ltd
        `
    }
}


const registrationInviteReminderEmailTemplate = ({fname, link, expiry}) => {
    return {
        html : `

        <p>Dear ${fname}, </p>
        <p>You have a pending invite to provide details of your company on Amni's Contractor Registration Portal.</p>
        <p> Please note that use of the Portal is subject to the terms and conditions which are shown on the sign up page and in the Portal.</p>
        <p> Your sign-up link is <a href="${link}" >${link}</a>.<p>
        <p> Please follow the link to provide details of your company on the Portal.<p>
        <p> This link will expire ${expiry} days from the day this email was sent.</p>
    
        <p>If you do not wish to provide details of your company on Amni's Portal then please ignore this e-mail.</p>
    
        <p>
        Sincerely,<br>
        <i>Contracts & Procurement team,</i><br>
        Amni International Petroleum Development Company Ltd
        </p>
    
    
        `,
        text: `

        Dear ${fname},
        <p>You have a pending invite to provide details of your company on Amni's Contractor Registration Portal.</p>
        Please note that use of the Portal is subject to the terms and conditions which are shown on the sign up page and in the Portal.
        Your sign-up link is ${link}
        Please follow the link to provide details of your company on the Portal.
        This link will expire ${expiry} days from the day this email was sent.
    
        If you do not wish to provide details of your company on Amni's Portal then please ignore this e-mail.
    
    
        Contracts & Procurement Team,
        Amni International Petroleum Development Company Ltd
        `
    }
}

const returnApplicationToVendorEmailTemplate = ({name, companyName, vendorID, issuesHTML, issuesText}) => {
    return {
        html : `

           <p>Dear ${name}, </p>
           <p>Thank you for your application for registration of ${companyName} on Amni's Contractor Registration Portal.</p>
           <p>The information provided  was not sufficient for your registration to be progressed.</p>
           <p>Please log back onto the Portal and provide the required additional information as per the highlighted issues listed below:</p>
           ${issuesHTML}

           <p>Please do not reply to this e-mail, as it is not monitored. Your application can only be progressed via the <a href="${process.env.FRONTEND_URL}/contractor/form/${vendorID}">PORTAL</a></p>

           Yours sincerely,<br>
           <i>Contracts & Procurement Team,</i><br>
           Amni
           </p>


           `,
        text: `

           Dear ${name},
           Thank you for registering ${companyName} on Amni's Contractor Registration Portal.
           The information provided  was not sufficient for your registration to be progressed.
           Please provide updated information as per the highlighted issues below:
           ${issuesText}

           Please do not reply to this e-mail, as it is not monitored. Your application can only be progressed via the PORTAL ${process.env.FRONTEND_URL}/contractor/form/${vendorID}

           Yours sincerely,
           Contracts & Procurement Team,
           Amni
           `
    }
}


const returnApplicationToVendorEmailApproverTemplate = ({name, companyName, vendorID, issuesHTML, issuesText}) => {
    return {
        html : `

           <p>Dear ${name}, </p>
           <p>This is a confirmation email for returning ${companyName}'s application on Amni's Contractor Registration Portal.</p>

           <p>The issues you listed are highlighted below:</p>
           ${issuesHTML}
           </p>


           `,
        text: `

           Dear ${name},
           This is a confirmation email for returning ${companyName}'s application on Amni's Contractor Registration Portal.

           The issues you listed are highlighted below:
           ${issuesText}
           `
    }
}

const recommendForHoldEmailTemplate = ({name, companyName, vendorID, issuesHTML, issuesText}) => {
    return {
        html :`

       <p>Dear Sir/Madame, </p>
       <p>

       The end user ${name} has recommended ${companyName} for
       Level 2 registration only.



       </p>

       <p>Please log on to the Contractor Registration Portal to confirm this action.</p>

       <p><a href="${process.env.FRONTEND_URL}/contractor/form/${vendorID}">Go to vendor application</a></p>

       Yours sincerely,<br>
       <i>Contracts & Procurement Team,</i><br>
       Amni
       </p>


       `,
        text: `

       Dear Sir,
       The end user ${name} has recommended ${companyName} for
       Level 2 registration only.
       Please log on to the Contractor Registration Portal to confirm this action.


       Yours sincerely,
       Contracts & Procurement Team,
       Amni


       `
    }
}


const applicationNeedingAttentionTemplate = ({action}) => {
    return {
        html :`

       <p>Dear Sir/Madame, </p>
       ${action}
       <p>Please log in to the portal and go to your Admin Dashboard to view the list of pending approvals </p>

       <p><a href="${process.env.FRONTEND_URL}">Go to vendor application</a></p>


       Yours sincerely,<br>
       <i>Contracts & Procurement Team,</i><br>
       Amni
       </p>


       `,
        text: `

       Dear Sir,
       ${action}
       Please log in to the portal go to your Admin Dashboard to view the list of pending approvals
       ${process.env.FRONTEND_URL}

       Yours sincerely,
       Contracts & Procurement Team,
       Amni


       `
    }
}

const endUserNotificationTemplate = (name, companyName) => {
    return {
        html :`

       <p>Dear Amni Team Member, </p>
       <p>

       As part of the contractor registration process,
       you have been identified as a possible end-user for
       ${companyName} which wishes to register as a contractor with Amni.



       </p>



       <p>
       Then please select 1 of 2 options:
       </p>
       <p><strong>Option 1 – Progress Registration</strong></p>
       <p>
       If you think that Amni should investigate this contractor further and carry out Due Diligence Checks then please:
       <ol type="a">
       <li>
       Confirm that you have reviewed the uploaded information and found that the contractor appears to be a suitable contractor for your Department.
       </li>
       <li>
       Select the type of services you would consider this Contractor could provide to Amni. (Please only select services for which you would be the “end-user”)
       </li>
       <li>
       Indicate if a site visit is required by an Amni Team to verify the capacity of ${companyName}.
       </li>
       </ol>
       </p>
       <p><strong>Option 2 – Complete Registration at this point.</strong></p>
       <p>
       If, after reviewing the information uploaded on the portal, you think that this contractor is NOT a suitable contractor for your Department, please select this option and the contractor’s registration will be complete at this point. (A Contractor’s registration can always be progressed further at a later time).
       </p>


       <p><a href="${process.env.FRONTEND_URL}/staff">PORTAL LOG-IN LINK</a></p>

       Yours sincerely,<br>
       <i>Contracts & Procurement Team,</i><br>
       Amni
       </p>


       `,
        text: `

       Dear Amni Team Member, 
       

       As part of the contractor registration process,
       you have been identified as a possible end-user for
       ${companyName} which wishes to register as a contractor with Amni.



       



    
       Then please select 1 of 2 options:
       
       Option 1 : Progress Registration
       
       If you think that Amni should investigate this contractor further and carry out Due Diligence Checks then please:
       
       Confirm that you have reviewed the uploaded information and found that the contractor appears to be a suitable contractor for your Department.
       
       Select the type of services you would consider this Contractor could provide to Amni. (Please only select services for which you would be the “end-user”)
       
       Indicate if a site visit is required by an Amni Team to verify the capacity of ${companyName}.
       Option 2 : Complete Registration at this point.
       
       If, after reviewing the information uploaded on the portal, you think that this contractor is NOT a suitable contractor for your Department, please select this option and the contractor’s registration will be complete at this point. (A Contractor’s registration can always be progressed further at a later time).


       Yours sincerely,
       Contracts & Procurement Team,
       Amni
       


       `
    }
}


const endUserApprovedNotificationTemplate = ({name, companyName, vendorID, issuesHTML, issuesText}) => {
    return {
        html :`

       <p>Dear Sir/Madame, </p>
       <p>

       The end user ${user} has reviewed and approved the registration for
       ${company.companyName} for the following job categories;


       ${catsHtml}


       </p>

       <p>${siteVisit}</p>



       <p>Please log on to the Contractor Registration Portal to confirm this action.</p>

       <p><a href="${this.loginLink}">PORTAL LOG-IN LINK</a></p>

       Yours sincerely,<br>
       <i>Contracts & Procurement Team,</i><br>
       Amni
       </p>


       `,
        text: `

       Dear Sir,
       The end user ${user} has reviewed and  approved  the registration for
       ${company.companyName} for the following job categories;
       ${catsText} .

       ${siteVisit}
       Please log on to the Contractor Registration Portal to confirm this action.


       Yours sincerely,
       Contracts & Procurement Team,
       Amni


       `
    }
}


module.exports = {
    registrationInviteEmailTemplate,
    registrationInviteReminderEmailTemplate,
    returnApplicationToVendorEmailTemplate,
    returnApplicationToVendorEmailApproverTemplate,
    recommendForHoldEmailTemplate,
    applicationNeedingAttentionTemplate,
    endUserNotificationTemplate,
    endUserApprovedNotificationTemplate
}