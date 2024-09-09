const { sendBasicResponse } = require("../../helpers/response");
const { UserModel } = require("../../models/user");

exports.fetchCurrentAuthState = async (req, res, next) => {
    try {
        console.log({user: req.user});
        const {uid} = req.user
        const userProfile = await UserModel.findOne({uid})

        sendBasicResponse(res, userProfile)
    } catch (error) {
        next(error)
    }
}