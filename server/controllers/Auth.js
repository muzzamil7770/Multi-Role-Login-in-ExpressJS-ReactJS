import User from "../models/UserModel.js";
import argon2 from "argon2";

// Registers a new user with complete details and returns the created user data.
export const registerUser = async (req, res) => {
    const { name, email, password, confPassword, role } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ msg: "All fields are required" });
    }

    if (password !== confPassword) {
        return res.status(400).json({ msg: "Password and confirm password do not match" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ msg: "Email already registered" });
    }

    const hashPassword = await argon2.hash(password);
    
    try {
        const newUser = await User.create({
            name,
            email,
            password: hashPassword,
            role: role || 'user' // Default to 'user' if not specified
        });

        res.status(201).json({
            msg: "Registration successful",
            user: {
                uuid: newUser.uuid,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// Authenticates a user, starts a session, and returns complete profile data.
export const Login = async (req, res) =>{
    const user = await User.findOne({
        where: {
            email: req.body.email
        }
    });
    if(!user) return res.status(404).json({msg: "User not found"});
    const match = await argon2.verify(user.password, req.body.password);
    if(!match) return res.status(400).json({msg: "Incorrect password"});
    req.session.userId = user.uuid;
    res.status(200).json({
        uuid: user.uuid, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        createdAt: user.createdAt
    });
}

// Returns the currently logged-in user's profile using the session id.
export const Me = async (req, res) =>{
    if(!req.session.userId){
        return res.status(401).json({msg: "Please log in to your account!"});
    }
    const user = await User.findOne({
        attributes:['uuid','name','email','role','createdAt'],
        where: {
            uuid: req.session.userId
        }
    });
    if(!user) return res.status(404).json({msg: "User not found"});
    res.status(200).json(user);
}

// Destroys the active session and logs the user out.
export const logOut = (req, res) =>{
    req.session.destroy((err)=>{
        if(err) return res.status(400).json({msg: "Unable to log out"});
        res.status(200).json({msg: "You have been logged out"});
    });
}
