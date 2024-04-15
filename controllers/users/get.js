const { admin } = require("../../auth/initializeFirebase");
const { allUsers } = require("./savedData");

exports.fetchAllEndUsers = async () => {
 try {
    admin.database().ref("endusers").get().then(result => {
      console.log({result});
    }).catch((error) => {
      console.log({error});
    })
 } catch (error) {
    next(error)
 }
}

exports.fetchAllUsers = async (req, res, next) => {
   try {

      remapUsers()

      // console.log({users});
      // migrateData()
   } catch (error) {
      next(error)
   }
}

const migrateJSONDataTOMongoDB = async () => {

}

  const saveDataToJSONFile = async () => {
   try {
      const data = await (await admin.firestore().collection("users").get()).docs

      let remappedUserdata = []

      data.forEach(item => {
         let dataItem = {...item.data()}

         // if (dataItem.phone && !dataItem?.phone?.number) {
         //    const remappedDataItem = {...dataItem, phone: {number: dataItem.phone}}

         // } 

         // if (dataItem.acceptedTermsAt && !)
         remappedUserdata.push(dataItem)
      })

      const fs = require("fs")
      const path = require("path")

      const dataJSON = JSON.stringify(remappedUserdata)


      fs.writeFileSync(path.join(__dirname, "./savedData.js"), JSON.stringify(remappedUserdata))
      console.log("Done");
   } catch (error) {
      console.log({error});
   }
  }

  const remapUsers = () => {
   const fs = require("fs")
      const path = require("path")
   const remappedUsers = allUsers.map((item) => {
      // if (item.phone && item.phone !== "" && !item?.phone?.number) {
      //    let numberToParse = item.phone

      //    if (typeof(numberToParse) === "number") {
      //       numberToParse = `${numberToParse}`
      //    }

      //    if (numberToParse.length === 10) {
      //       numberToParse = `+234${numberToParse}`
      //    }

      //    if (numberToParse.length === 9) {
      //       numberToParse = `+234 ${numberToParse}`
      //    }

      //    if (numberToParse.length === 11 && numberToParse.startsWith("0")) {
      //       numberToParse = `+234${numberToParse.substring(1,11)}`
      //    }

      //    if (numberToParse.length === 13) {
      //       numberToParse = `+${numberToParse.substring(1,11)}`
      //    }

      //    try {
      //       const phoneLib = require("libphonenumber-js")
      //    const parsedNumber = phoneLib.parsePhoneNumber(numberToParse)
      //    const nationalNumber = parsedNumber.nationalNumber
      //    const number = parsedNumber.number
      //    const countryCode = parsedNumber.country
      //    const dialCode = `+${parsedNumber.countryCallingCode}`

      //    console.log({number, nationalNumber});
      //    return {...item, phone: {number, nationalNumber, countryCode, dialCode }}
      //    } catch (error) {
      //       return {...item, phone: {number: "", nationalNumber : "", countryCode: "", dialCode: "" }}
      //    }

         
         
      // } else {
      //    return item
      // }

      if (item?.acceptedTermsAt?._seconds) {
         const date = new Date(item.acceptedTermsAt._seconds * 1000)
         return {...item, acceptedTermsAt: date}
         console.log({date});
      } else {
         return {...item}
      }
   })

   fs.writeFileSync(path.join(__dirname, "./savedData.js"), JSON.stringify(remappedUsers))
   // console.log("Done");
  }