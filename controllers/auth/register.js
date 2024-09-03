const { admin } = require("../../auth/initializeFirebase");
const { Error400Handler, Error403Handler } = require("../../errorHandling/errorHandlers");
const { sendMail } = require("../../helpers/mailer");
const { sendBasicResponse } = require("../../helpers/response");
const { Invite } = require("../../models/invite");
const moment = require("moment");
const { UserModel } = require("../../models/user");

exports.validateRegistrationHash = async (req, res, next) => {
    try {
        console.log(req.params);
        const {hash} = req.params

        if (!hash) {
            throw new Error400Handler("You don't have a valid invite. Please contact the system administrator for assistance.")
        }

        //check if a record exists for the provided hash
        const invite = await Invite.findOne({hash})

        if (invite) {
            console.log({invite});

            if (invite.used) {
                throw new Error403Handler("This invite link has been used.")
            }
           
            //Check if invite has expired

            const currentDate = moment()
            const expiryDate = moment(invite.expiry)
            const daysDifference = currentDate.diff(expiryDate, "days")

            if (daysDifference >= 0 ) {
                throw new Error403Handler("Your invite has expired. Please contact the contracts officer to be sent a new invite.")
            } else {
                sendBasicResponse(res, invite)
            }
            
        } else {
            throw new Error400Handler("You don't have a valid invite. Please contact the system administrator for assistance.")
        }

        console.log({invite});
    } catch (error) {
        next(error)
    }
}

exports.registerNewAccount = async (req, res, next) => {
    try {
        const {password, passwordConfirm, hash} = req.body
        const phoneNumberFormatter = require("libphonenumber-js")
        
        //Confirm registration hash and fetch invite details
        const inviteWithHash = await Invite.findOne({hash})

        console.log({inviteWithHash});

        if (!hash || !inviteWithHash) {
            throw new Error403Handler("You don't have a valid invite")
        }

        const parsedPhoneNumber = phoneNumberFormatter.parsePhoneNumber(inviteWithHash.phone, "NG")

        //Validate received passwords

        const passwordsAreValid = validatePasswords(password, passwordConfirm)

        if (!passwordsAreValid.isValid) {
            throw new Error400Handler(passwordsAreValid.errorMessage)
        }

        //Create new user account on Firebase
        admin.auth().createUser({email: inviteWithHash.email, password: password, phoneNumber: parsedPhoneNumber.formatInternational(), displayName: `${inviteWithHash.fname} ${inviteWithHash.lname}`, emailVerified: true}).then(async result => {
            console.log({result: result.providerData});

            //Create new user record
            const user = new UserModel({
                name: inviteWithHash.name,
                providerId: "firebase",
                email: inviteWithHash.email,
                uid: result.uid,
                phone: inviteWithHash.phone
            })

            const newUser = await user.save()

            console.log({newUser});

            //Update invite to show that invite has been used
            const date = new Date()
            const used = date.getTime()
            const updatedInvite = await Invite.findOneAndUpdate({_id: inviteWithHash._id}, {used})

            console.log({updatedInvite});

            if (updatedInvite) {
                //Send response to the front end
                sendBasicResponse(res, {})
            } else {
                //Send operation to a repeat queue
                sendBasicResponse(res, {})
            }

            

            //Send an email to the administrator or the person who sent the invite to inform them that the user they invited has completed their registration.
            // const sendInviteEmail = await sendMail({
            //     to: email,
            //     bcc: req.user.email,
            //     subject: "Amni's Contractor Registration Portal Sign-up Link",
            //     html: registrationInviteEmailTemplate({
            //         fname,
            //         expiry: 7,
            //         link: `${process.env.FRONTEND_URL}/register/${hash}`
            //     }).html,
            //     text: registrationInviteEmailTemplate({
            //         fname,
            //         expiry: 3,
            //         link: `${process.env.FRONTEND_URL}/register/${hash}`
            //     }).text
            // })
    
            // if (sendInviteEmail[0].statusCode === 202 || sendInviteEmail[0].statusCode === "202") {
            //     sendBasicResponse(res, {})
            // }
        }).catch(error => {
            res.status(400).send({status: "FAILED", error: {message: error.errorInfo.message}})
        })

        

        


    } catch (error) {
        next(error)
    }
}

const validatePasswords = (password, passwordConfirmation) => {
    const passwordRegex = /^(?=.*\d)(?=.*[#$@!%&*?])[A-Za-z\d#$@!%&*?]{8,}$/
    if (!password) {
        return({
            isValid: false,
            errorMessage: "A password is required."
        })
    } else if (!passwordRegex.test(password)) {
        return {
            isValid: false,
            errorMessage: "Your password must be at least 8 characters long and contain at least one uppercase letter, one number and one special character."
        }
    } else if (password !== passwordConfirmation) {
        return {
            isValid: false,
            errorMessage: "The passwords you provided do not match."
        }
    } else {
        return {
            isValid: true
        }
    }
}