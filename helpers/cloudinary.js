const cloudinary = require("cloudinary").v2

cloudinary.config({
    cloud_name: "dbj52s7hw",
    api_key: "278657844862226",
    api_secret: "mYuSzGpr51_4fL58FWo4iucVRe8"
})

module.exports = {
    cloudinary
}