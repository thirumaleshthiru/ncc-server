import jwt from 'jsonwebtoken'
 
export const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"]?.split(' ')[1];
 

    if (!token) {
        return res.status(401).json({ message: "Authentication failed: No token provided" });
    }

    try {
        const verified = jwt.verify(token, "thirumalesh@79");
        req.user = verified;
       
        next();
    } catch (err) {
        console.error("JWT Error:", err.message); 
        return res.status(403).json({ message: err.message });  
    }
};

export const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "You are not the admin bro" });  
    }
    next();
}


export const isMentor = (req, res, next) => {
    if (req.user.role !== 'mentor') {
        return res.status(403).json({ message: "You are not the admin bro" });  
    }
    next();
}
