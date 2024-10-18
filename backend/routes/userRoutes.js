import express from "express";
import {
	followUnFollowUser,
	getUserProfile,
	loginUser,
	logoutUser,
	signupUser,
	updateUser,
	getSuggestedUsers,
	freezeAccount,
	getUsers,
	getFollowers,
	getFollowing,
	verifyEmail,requestPasswordReset,resetPassword
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();


router.get("/profile/:query", getUserProfile);
router.get("/allusers", protectRoute, getUsers);
router.get("/followers/:id", protectRoute, getFollowers);


router.get("/following/:id", protectRoute, getFollowing);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.get("/verify-email/:token/:email", verifyEmail);
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/follow/:id", protectRoute, followUnFollowUser); // Toggle state(follow/unfollow)
router.put("/update/:id", protectRoute, updateUser);
router.put("/freeze", protectRoute, freezeAccount);
router.post('/request-password-reset', requestPasswordReset);

// Route to reset the password (user submits new password using the token)
router.post('/reset-password/:token', resetPassword);

export default router;
