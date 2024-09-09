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

module.exports = {
    registrationInviteEmailTemplate,
    registrationInviteReminderEmailTemplate
}