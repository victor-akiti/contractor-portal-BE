exports.getAllCompanies = async (req, res, next) => {
    try {
        console.log("Getting all companies");
    } catch (error) {
        next(error)
    }
}