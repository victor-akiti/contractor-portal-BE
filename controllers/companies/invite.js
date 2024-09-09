const moment = require("moment");
const { Error400Handler, Error404Handler } = require("../../errorHandling/errorHandlers");
const { Invite } = require("../../models/invite");
const { sendMail } = require("../../helpers/mailer");
const { registrationInviteEmailTemplate, registrationInviteReminderEmailTemplate } = require("../../helpers/emailTemplates");
const { sendBasicResponse } = require("../../helpers/response");
const { ArchivedInvite } = require("../../models/inviteArchive");
const { default: mongoose } = require("mongoose");
const { importRandomStringGen } = require("../../helpers/randomTextGen");

exports.createNewInvite = async (req, res, next) => {
    try {
      
      const {fname, lname, email, phone, companyName} = req.body

      if (!fname || !lname || !email || !phone || !companyName) {
        throw new Error400Handler("One or more required fields is not filled. Please make sure all fields are filled.")
      }

      //Check if email already exists
      const inviteEmailIsUsedFor = await Invite.findOne({email})

      if (inviteEmailIsUsedFor) {
        throw new Error400Handler("A company is already registered with this email address.")
      }

      //Check if there is an exact match for the company name that already exists
      var companyNameRegex =  `^${companyName}$`
      const inviteCompanyNameIsUsedFor = await Invite.findOne({'companyName': {'$regex': companyNameRegex,$options:'i'}})

      if (inviteCompanyNameIsUsedFor) {
        throw new Error400Handler("A company with the exact same company name is already registered.")
      }

      const currentDate = new Date()
      const dateInThreeDays = moment(currentDate, "DD-MM-YYYY").add('7', "days")
      dateInThreeDays.date
      console.log({date: dateInThreeDays.date, string: dateInThreeDays.toISOString()});

      const cryptoRandomString = await importRandomStringGen()
      const hash = cryptoRandomString
      const date = new Date()

      //Create new invite and save to invite collection
      const newInvite = new Invite({
        fname,
        lname,
        email,
        name: `${fname} ${lname}`,
        companyName,
        phone,
        expiry: dateInThreeDays.toISOString(),
        invitedBy: {
            uid: req.user.uid,
            displayName: req.user.name,
            email: req.user.email
        },
        inviteHistory: [{
          fname,
          lname,
          email,
          name: `${fname} ${lname}`,
          companyName,
          phone,
          expiry: dateInThreeDays.toISOString(),
          invitedBy: {
              uid: req.user.uid,
              displayName: req.user.name,
              email: req.user.email
          },
          type: "INVITE SENT",
          comment: "Invite created and sent to contractor",
          date: date.getTime()
        }],
        hash
      })

      const savedNewInvite = await newInvite.save()

      if (savedNewInvite) {
        //Send notification email to contractor and staff that sent the invite 
        const sendInviteEmail = await sendMail({
            to: email,
            bcc: req.user.email,
            subject: "Amni's Contractor Registration Portal Sign-up Link",
            html: registrationInviteEmailTemplate({
                fname,
                expiry: 7,
                link: `${process.env.FRONTEND_URL}/register/${hash}`
            }).html,
            text: registrationInviteEmailTemplate({
                fname,
                expiry: 3,
                link: `${process.env.FRONTEND_URL}/register/${hash}`
            }).text
        })

        if (sendInviteEmail[0].statusCode === 202 || sendInviteEmail[0].statusCode === "202") {
            sendBasicResponse(res, {})
        }


      }

    } catch (error) {
        next(error)
    }
}

exports.resendInvite = async (req, res, next) => {
  try {
    
    const {fname, lname, email, phone, companyName, inviteID} = req.body


    const existingInvite = await Invite.findOne({_id: inviteID})

    if (!fname || !lname || !email || !phone || !companyName) {
      throw new Error400Handler("One or more required fields is not filled. Please make sure all fields are filled.")
    }

    //Check if email already exists
    const inviteEmailIsUsedFor = await Invite.findOne({email})

    if (inviteEmailIsUsedFor && inviteEmailIsUsedFor.email !== existingInvite.email) {
      throw new Error400Handler("A company is already registered with this email address.")
    }

    //Check if there is an exact match for the company name that already exists
    var companyNameRegex =  `^${companyName}$`
    const inviteCompanyNameIsUsedFor = await Invite.findOne({'companyName': {'$regex': companyNameRegex,$options:'i'}})

    if (inviteCompanyNameIsUsedFor && inviteCompanyNameIsUsedFor.companyName !== existingInvite.companyName) {
      throw new Error400Handler("A company with the exact same company name is already registered.")
    }

    let changes = []
    let updatedInvite = {}

    if (fname !== existingInvite.fname) {
      changes.push("First name")
      updatedInvite.fname = fname
    }

    if (lname !== existingInvite.lname) {
      changes.push("Last name")
      updatedInvite.lname = lname
    }

    if (email !== existingInvite.email) {
      changes.push("Email")
      updatedInvite.email = email
    }

    if (phone.number !== existingInvite.phone.number) {
      changes.push("Phone number")
      updatedInvite.phone = {
        number: phone
      }
    }

    if (companyName !== existingInvite.companyName) {
      changes.push("Company name")
      updatedInvite.companyName = companyName
    }

    if (changes.length === 0) {
      throw new Error400Handler("You made no changes to the invite.")
    }


    const currentDate = new Date()
    const dateInThreeDays = moment(currentDate, "DD-MM-YYYY").add('7', "days")
    dateInThreeDays.date
    console.log({date: dateInThreeDays.date, string: dateInThreeDays.toISOString()});

    const cryptoRandomString = await importRandomStringGen()
    const hash = cryptoRandomString
    const date = new Date()
    updatedInvite.expiry = dateInThreeDays.toISOString()
    updatedInvite.hash = hash
    updatedInvite.name = `${fname} ${lname}`
    updatedInvite.invitedBy = {
      uid: req.user.uid,
      displayName: req.user.name,
      email: req.user.email
  }

  // updatedInvite["inviteHistory"] = existingInvite.inviteHistory

  // console.log({updatedInvite});
  

  // if (updatedInvite.inviteHistory.length !== 0) {
  //   updatedInvite.inviteHistory.push({
  //     previousInvite: existingInvite,
  //     date: date.getTime(),
  //     type: "INVITE RESENT",
  //     comments:  `Made changes to ${changes.toString()}`
  //   })
  // } else {
  //   updatedInvite.inviteHistory = [{
  //     previousInvite: existingInvite,
  //     date: date.getTime(),
  //     comments:  `Made changes to ${changes.toString()}`,
  //     type: "INVITE RESENT",
  //   }]
  // }



  delete updatedInvite._id
  delete updatedInvite.createdAt
  delete updatedInvite.updatedAt

  console.log({updatedInvite});
  const currentInviteID = String(existingInvite._id)

  console.log({currentInviteID});

    //Update existing invite

    const savedUpdatedInviteObject = await Invite.findOneAndUpdate({_id: currentInviteID}, {...updatedInvite, $push: {"inviteHistory": {
      previousInvite: existingInvite,
      date: date.getTime(),
      comments:  `Made changes to ${changes.toString()}`,
      type: "INVITE RESENT",
    }}}, {new: true})

    console.log({savedUpdatedInviteObject});
    

    if (savedUpdatedInviteObject) {
      //Send notification email to contractor and staff that sent the invite 
      const sendInviteEmail = await sendMail({
          to: email,
          bcc: req.user.email,
          subject: "Amni's Contractor Registration Portal Sign-up Link",
          html: registrationInviteEmailTemplate({
              fname,
              expiry: 7,
              link: `${process.env.FRONTEND_URL}/register/${hash}`
          }).html,
          text: registrationInviteEmailTemplate({
              fname,
              expiry: 3,
              link: `${process.env.FRONTEND_URL}/register/${hash}`
          }).text
      })

      if (sendInviteEmail[0].statusCode === 202 || sendInviteEmail[0].statusCode === "202") {
          sendBasicResponse(res, {})
      }


    }

  } catch (error) {
      next(error)
  }
}

exports.renewInvite = async (req, res, next) => {
  try {
    console.log(req.params);

    //Check if invite id and invite exist
    const {id} = req.params

    const existingInvite = await Invite.findOne({_id: id})

    if (!id || !existingInvite) {
      throw new Error400Handler("Could not find an invite to renew. The invite may have been archived or deleted.")
    }

    //Update expiry date and add activity to invite history
    const currentDate = new Date()
    const dateInThreeDays = moment(currentDate, "DD-MM-YYYY").add('7', "days")
    const date = new Date()

    const savedUpdatedInviteObject = await Invite.findOneAndUpdate({_id: id}, {expiry: dateInThreeDays.toISOString(), $push: {"inviteHistory": {
      previousInvite: existingInvite,
      date: date.getTime(),
      comments:  `Renewed invite`,
      type: "INVITE RENEWED",
    }}}, {new: true})

    //Send email to invite recipient and initiator
    const sendInviteEmail = await sendMail({
      to: existingInvite.email,
      bcc: req.user.email,
      subject: "Amni's Contractor Registration Portal Sign-up Link",
      html: registrationInviteEmailTemplate({
          fname: existingInvite.fname,
          expiry: 7,
          link: `${process.env.FRONTEND_URL}/register/${existingInvite.hash}`
      }).html,
      text: registrationInviteEmailTemplate({
          fname: existingInvite.fname,
          expiry: 3,
          link: `${process.env.FRONTEND_URL}/register/${existingInvite.hash}`
      }).text
    })

    console.log({sendInviteEmail});

    if (sendInviteEmail[0].statusCode === 202 || sendInviteEmail[0].statusCode === "202") {
        sendBasicResponse(res, {})
    }

    //Add event notification


  } catch (error) {
    console.log({error: error.response.body.errors});
    next(error)
  }
}

exports.sendInviteReminder = async (req, res, next) => {
  try {
    console.log({params: req.params});
    const {id} = req.params

    const invite = await Invite.findOne({_id: id})

    console.log({invite});

    if (!id || !invite) {
      throw new Error404Handler("This invite is not valid or has been deleted.")
    }

    const sendInviteEmail = await sendMail({
      to: invite.email,
      bcc: req.user.email,
      subject: "Reminder: Amni's Contractor Registration Portal Sign-up Link",
      html: registrationInviteReminderEmailTemplate({
          fname: invite.fname,
          expiry: 7,
          link: `${process.env.FRONTEND_URL}/register/${invite.hash}`
      }).html,
      text: registrationInviteEmailTemplate({
          fname: invite.fname,
          expiry: 3,
          link: `${process.env.FRONTEND_URL}/register/${invite.hash}`
      }).text
  })

  if (sendInviteEmail[0].statusCode === 202 || sendInviteEmail[0].statusCode === "202") {
      sendBasicResponse(res, {})
      const date = new Date()
      const lastReminderSent = date.getTime()
      const inviteHistory = [...invite.inviteHistory]
      inviteHistory.push({
        comment: "Sent a reminder to contractor",
        type: "INVITE RESENT",
        date: date.getTime() 
      })

      const updateInviteHistory = await Invite.findOneAndUpdate({_id: id}, {lastReminderSent, inviteHistory})
  }


  } catch (error) {
    next(error)
  }
}


exports.getAllInvitedCompanies = async () => {
  try {
    console.log();
  } catch (error) {
    next(error)
  }
}

exports.archiveInvite = async (req, res, next) => {
  try {
    //save current invite to invite archive
    const newArchivedInvite = new ArchivedInvite(req.body)
    const savedArchivedInvite = await newArchivedInvite.save()

    if (savedArchivedInvite) {
      //delete current invite from invite collection
      const deletedInvite = await Invite.findOneAndDelete({_id: req.body._id})

      console.log({deletedInvite});

      if (deletedInvite) {
        sendBasicResponse(res, {})
      }
    }


  } catch (error) {
    next(error)
  }
}

exports.getInvite = async (req, res, next) => {
  try {
    console.log(req.params);
    const {id} = req.params

    if (!id) {
      throw new Error400Handler("An ID is required to fetch an invite.")
    }

    const invite = await Invite.findOne({_id: id})

    if (!invite) {
      throw new Error404Handler("There wan no invite found for this id")
    }

    sendBasicResponse(res, invite)
  } catch (error) {
    next(error)
  }
}

