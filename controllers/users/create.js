exports.createEndUser = async (req, res, next) => {
    try {
        console.log({body: req.body});
        
    } catch (error) {
        next(error)
    }
}