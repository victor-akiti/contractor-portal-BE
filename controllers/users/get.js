const { admin } = require("../../auth/initializeFirebase");
const { sendBasicResponse } = require("../../helpers/response");
const { UserModel } = require("../../models/user");
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
      const allStaff = await UserModel.find({role: {$nin: "Vendor"}})

      //Sort all staff alphabetically

      allStaff.sort((a, b) => {
         if (a.name < b.name) {
            return -1
         }
         if (a.firstName > b.firstName) {
            return 1
         }
         return 0
      })

      const allVendors = await UserModel.find({role: "Vendor"})

      allVendors.sort((a, b) => {
         if (a.name < b.name) {
            return -1
         }
         if (a.firstName > b.firstName) {
            return 1
         }
         return 0
      })

      sendBasicResponse(res, {
         allStaff,
         allVendors
      })
      
      
   } catch (error) {
      next(error)
   }
}

exports.fetchAllStaff = async (req, res, next) => {
   try {

      const allStaff = await UserModel.find({role: {$nin: "User"}})

      //Sort all staff alphabetically

      allStaff.sort((a, b) => {
         if (a.name < b.name) {
            return -1
         }
         if (a.firstName > b.firstName) {
            return 1
         }
         return 0
      })

      sendBasicResponse(res, allStaff)
      
      
   } catch (error) {
      next(error)
   }
}

exports.fetchAllCnPStaff = async (req, res, next) => {
   try {

      const cnpStaff = await UserModel.find({role: {$in: ["VRM", "C and P Staff", "CO", "GM", "Supervisor",  "HOD", "C&P Admin"]}})

      //Sort all staff alphabetically
      const user = req.user
      
      const userRecord = await UserModel.findOne({uid: user.uid})
      

      cnpStaff.sort((a, b) => {
         if (a.name < b.name) {
            return -1
         }
         if (a.firstName > b.firstName) {
            return 1
         }
         return 0
      })

      let sortedList = []

      for (let index = 0; index < cnpStaff.length; index++) {
         const item = cnpStaff[index];


         console.log(userRecord._id, item._id);
         
         if (!item.substitute) {
            if ((userRecord.role === "HOD" && item.role === "Supervisor" ) || (userRecord.role === "HOD" && item.role === "VRM") || (userRecord.role === "Supervisor" && item.role === "VRM") || (String(userRecord._id) === String(item._id)) ) {
               
            } else {
               sortedList.push(item)
            }
         }
      }



      sendBasicResponse(res, sortedList)
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