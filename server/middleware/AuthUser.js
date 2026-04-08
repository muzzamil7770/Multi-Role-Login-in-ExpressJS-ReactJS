import User from "../models/UserModel.js";

// Verifies that the request has a valid session and attaches user data to the request.
export const verifyUser = async (req, res, next) =>{
    if(!req.session.userId){
        return res.status(401).json({msg: "Please log in to your account!"});
    }
    const user = await User.findOne({
        where: {
            uuid: req.session.userId
        }
    });
    if(!user) return res.status(404).json({msg: "User not found"});
    req.userId = user.id;
    req.role = user.role; 
    next();
}

// Allows access only to users with the admin role.
export const adminOnly = async (req, res, next) =>{
    const user = await User.findOne({
        where: {
            uuid: req.session.userId
        }
    });
    if(!user) return res.status(404).json({msg: "User not found"});
    if(user.role !== "admin") return res.status(403).json({msg: "Access forbidden"});
    next();
}
