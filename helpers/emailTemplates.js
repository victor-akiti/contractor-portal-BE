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

const setAsSubstituteTemplate = ({staffName, substituteName}) => {
    return {
        html :`

       <p>Dear ${substituteName}, </p>
       <p>
       ${staffName} is out of office and has set you as their substitute while they are away. All their tasks will be routed to you for action till they return.
       </p>

       <p>Please log on to the Contractor Registration Portal to see what pending tasks you have to perform.</p>

       Yours sincerely,<br>
       <i>Contracts & Procurement Team,</i><br>
       Amni
       </p>


       `,
        text: `

       Dear ${substituteName},
       ${staffName} is out of office and has set you as their substitute while they are away. All their tasks will be routed to you for action till they return.

       Please log on to the Contractor Registration Portal to see what pending tasks you have to perform.

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

const newPortalAdminRequestTemplate = ({companyName, hash}) => {
    return {
        html :`

    <p>You have been nominated by ${companyName} to be their new Amni portal administrator.</p>
    <p> Please note that use of the Portal is subject to the terms and conditions which are shown on the sign up page and in the Portal.</p>
    <p> Your sign-up link is <a href="${process.env.FRONTEND_URL}/portalAdmin/new/${hash}" >${process.env.FRONTEND_URL}/portalAdmin/new/${hash}</a>.<p>
    <p> Please follow the link to create an account that would be set up as the new Amni contractors portal administrator for the company.<p>
    <p> This link will expire 7 days from the day this email was sent.</p>

    <p>If you do not wish to proceed, please ignore this e-mail.</p>

    <p>
    Sincerely,<br>
    <i>Contracts & Procurement team,</i><br>
    Amni International Petroleum Development Company Ltd
    </p>


    `,
        text: `

    You have been nominated by ${companyName} to be their new Amni portal administrator.
    Please note that use of the Portal is subject to the terms and conditions which are shown on the sign up page and in the Portal.
    Your sign-up link is ${process.env.FRONTEND_URL}/portalAdmin/new/${hash}
    Please follow the link to create an account that would be set up as the new portal administrator for the company.
    This link will expire 7 days from the day this email was sent.

    If you do not wish to poceed, please ignore this e-mail.


    Contracts & Procurement Team,
    Amni International Petroleum Development Company Ltd
    `
    }
}

const returnForDataUpdateTemplate = ({companyName, adminName }) => {
    return {
        html :`
        <p>Dear ${adminName} of ${companyName},</p>


        <p>You are listed in Amni’s Vendor Registration Portal as the “Portal Administrator” for ${companyName}</p>

        <p>To ensure the registration for ${companyName} is up-to-date, kindly update all your company’s details, including the following:</p>

        <ul>

            <li><strong>Contact Info:</strong> please check and update as necessary your business addresses, your primary and secondary contacts and their e-mails and phone numbers.</li>

            <li><strong>Directors & Shareholders:</strong> if there have been any changes in your directors and/or shareholders please provide the up-to-date CAC documents. Please also input the names of your directors and shareholders.</li>

            <li><strong>Business Activities:</strong> please provide a current list of the services that you provide as they relate to upstream oil and gas activities.</li>

            <li><strong>HSE Record:</strong> please provide your 2024 HSE statistics.</li>

            <li><strong>Business & Finance:</strong> please provide your latest TCC, 2024 turnover, audited accounts for the last 3 years and your relevant Oil & Gas business activities in the last 2 years</li>

            <li><strong>Insurance:</strong> please provide your current insurance certificates (e.g., General 3rd Party Liability, Workers' Compensation etc).</li>

            <li><strong>Licenses & Permits:</strong> please upload your current licenses/permits as relevant to upstream oil and gas services.</li>
        </ul>


        <p>Please log on to Amni’s Vendor Registration portal to update your data.</p>

        <p>The portal is accessed as follows: <a href="https://contractors.amni.com/login">https://contractors.amni.com/login</a></p>


        <p>Your login details are the registered email address, which is the same e-mail address that this e-mail has been sent to and your password.</p>


        <p>If you have forgotten your password, then you can reset your password by visiting the following link: <a href="https://contractors.amni.com/forgotPassword">https://contractors.amni.com/forgotPassword</a> and entering your registered email address and a password reset link will be e-mailed to you.</p>


        <p>If you would like to have a different person nominated as your Company’s “Portal Administrator” then please advise Amni by e-mail to <strong><a href="mailto:idris.gbolahan@amni.com">idris.gbolahan@amni.com</a></strong> and advise the name, phone number and e-mail of the new nomination, and then this e-mail will be sent to the new “Portal Administrator”.</p>


        <p>If ${companyName} no longer wishes to be registered with Amni please advise Amni by e-mail to <strong><a href="mailto:idris.gbolahan@amni.com">idris.gbolahan@amni.com</a></strong></p>


    `,
        text: `

    Dear [Person’s Name] of [Company Name],


        You are listed in Amni’s Vendor Registration Portal as the “Portal Administrator” for [Company Name]

        To ensure the registration for [Company Name] is up-to-date, kindly update all your company’s details, including the following:

        · Contact Info: please check and update as necessary your business addresses, your primary and secondary contacts and their e-mails and phone numbers.

        · Directors & Shareholders: if there have been any changes in your directors and/or shareholders please provide the up-to-date CAC documents. Please also input the names of your directors and shareholders.

        · Business Activities: please provide a current list of the services that you provide as they relate to upstream oil and gas activities.

        · HSE Record: please provide your 2024 HSE statistics.

        · Business & Finance: please provide your latest TCC, 2024 turnover, audited accounts for the last 3 years and your relevant Oil & Gas business activities in the last 2 years

        · Insurance: please provide your current insurance certificates (e.g., General 3rd Party Liability, Workers' Compensation etc).

        · Licenses & Permits: please upload your current licenses/permits as relevant to upstream oil and gas services.


        Please log on to Amni’s Vendor Registration portal to update your data.

        The portal is accessed as follows: https://contractors.amni.com/login


        Your login details are the registered email address, which is the same e-mail address that this e-mail has been sent to and your password.


        If you have forgotten your password, then you can reset your password by visiting the following link: https://contractors.amni.com/forgotPassword and entering your registered email address and a password reset link will be e-mailed to you.


        If you would like to have a different person nominated as your Company’s “Portal Administrator” then please advise Amni by e-mail to idris.gbolahan@amni.com and advise the name, phone number and e-mail of the new nomination, and then this e-mail will be sent to the new “Portal Administrator”.


        If ${companyName} no longer wishes to be registered with Amni please advise Amni by e-mail to idris.gbolahan@amni.com
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
    endUserApprovedNotificationTemplate,
    setAsSubstituteTemplate,
    newPortalAdminRequestTemplate,
    returnForDataUpdateTemplate
}