const admin = require("firebase-admin")
const fs = require("fs")
const path = require("path")
const serviceKeys = fs.readFileSync(path.join(__dirname, "../files/misc/firebaseServiceKeys.json"));
var serviceAccount = JSON.parse(serviceKeys);


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://amni-contractors.firebaseio.com',
    storageBucket: 'amni-contractors.firebaseio.com',
    projectId: "amni-contractors",
})

module.exports = {
    admin
}