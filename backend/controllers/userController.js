import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import crypto from 'crypto'; // To generate a random token

import nodemailer from 'nodemailer'; // For sending emails


const signupUser = async (req, res) => {
	try {
		const { name, email, username, password } = req.body;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: "Invalid email format" });
		}

		const user = await User.findOne({ $or: [{ email }, { username }] });

		if (user && user.isVerified) {
			return res.status(400).json({ error: "User already exists" });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create a verification token
		const verificationToken = crypto.randomBytes(32).toString('hex');

		const newUser = new User({
			name,
			email,
			username,
			password: hashedPassword,
			verificationToken,
			isVerified: false // Set isVerified to false initially
		});
		await newUser.save();

		if (newUser) {
			// Send verification email
			const verificationLink = `${req.protocol}://${req.get('host')}/verify-email/${verificationToken}/${email}`;

			await sendVerificationEmail(email, verificationLink);

			res.status(201).json({
				message: "Signup successful! Please check your email for verification.",
				_id: newUser._id,
				name: newUser.name,
				email: newUser.email,
				username: newUser.username,
				bio: newUser.bio,
				profilePic: newUser.profilePic,
				isVerified: newUser.isVerified
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in signupUser: ", err.message);
	}
};

// Function to send the verification email
const sendVerificationEmail = async (email, verificationLink) => {
    try {
         // Encode the link
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification',
            html: `<p> Please verify your email by clicking the link below:</p>
                   <a href="${verificationLink}">Verify Email</a>` // Use encoded link
				   
        };

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', email);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Error sending verification email');
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token, email } = req.params;
        
        // Log token and email for debugging
        console.log("Token:", token);
        console.log("Email:", email);

        // Check if token and email exist
        if (!token || !email) {
            return res.status(400).json({ error: "Missing token or email" });
        }

        // Find the user with the corresponding email and token
        const user = await User.findOne({ email, verificationToken: token });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        // Mark the user as verified
        user.isVerified = true;
        user.verificationToken = null; // Clear the token after verification
        await user.save();

        // Send back a success message and any required data (e.g., token)
		generateTokenAndSetCookie(user._id, res);

		res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			username: user.username,
			bio: user.bio,
			profilePic: user.profilePic,
		});
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log("Error in verifyEmail: ", err.message);
    }
};





// Function to send the verification email

const getUserProfile = async (req, res) => {
	// We will fetch user profile either with username or userId
	// query is either username or userId
	const { query } = req.params;

	try {
		let user;

		// query is userId
		if (mongoose.Types.ObjectId.isValid(query)) {
			user = await User.findOne({ _id: query }).select("-password").select("-updatedAt");
		} else {
			// query is username
			user = await User.findOne({ username: query }).select("-password").select("-updatedAt");
		}

		if (!user) return res.status(404).json({ error: "User not found" });

		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in getUserProfile: ", err.message);
	}
};



const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        // Check if user exists and if the password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if (!user || !isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        // Check if user is verified
        if (!user.isVerified) {
            // Generate a new verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            user.verificationToken = verificationToken;

            // Save the updated user with the new verification token
            await user.save();

            // Send a new verification email
            const verificationLink = `${req.protocol}://${req.get('host')}/verify-email/${verificationToken}/${user.email}`;
            await sendVerificationEmail(user.email, verificationLink);

            return res.status(403).json({
                error: "User account is not verified. A verification email has been sent. Please check your email and verify your account."
            });
        }

        // Unfreeze the account if it was frozen
        if (user.isFrozen) {
            user.isFrozen = false;
            await user.save();
        }

        // Generate token and set cookie
        generateTokenAndSetCookie(user._id, res);

        // Send user data in the response
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            bio: user.bio,
            profilePic: user.profilePic,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log("Error in loginUser: ", error.message);
    }
};



const logoutUser = (req, res) => {
	try {
		res.cookie("jwt", "", { maxAge: 1 });
		res.status(200).json({ message: "User logged out successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in signupUser: ", err.message);
	}
};

const followUnFollowUser = async (req, res) => {
	try {
		const { id } = req.params;
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		if (id === req.user._id.toString())
			return res.status(400).json({ error: "You cannot follow/unfollow yourself" });

		if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

		const isFollowing = currentUser.following.includes(id);

		if (isFollowing) {
			// Unfollow user
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
			res.status(200).json({ message: "User unfollowed successfully" });
		} else {
			// Follow user
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
			res.status(200).json({ message: "User followed successfully" });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in followUnFollowUser: ", err.message);
	}
};

const updateUser = async (req, res) => {
	const { name, email, username, password, bio } = req.body;
	let { profilePic } = req.body;

	const userId = req.user._id;
	try {
		let user = await User.findById(userId);
		if (!user) return res.status(400).json({ error: "User not found" });

		if (req.params.id !== userId.toString())
			return res.status(400).json({ error: "You cannot update other user's profile" });

		if (password) {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			user.password = hashedPassword;
		}

		if (profilePic) {
			if (user.profilePic) {
				await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profilePic);
			profilePic = uploadedResponse.secure_url;
		}

		user.name = name || user.name;
		user.email = email || user.email;
		user.username = username || user.username;
		user.profilePic = profilePic || user.profilePic;
		user.bio = bio || user.bio;

		user = await user.save();

		// Find all posts that this user replied and update username and userProfilePic fields
		await Post.updateMany(
			{ "replies.userId": userId },
			{
				$set: {
					"replies.$[reply].username": user.username,
					"replies.$[reply].userProfilePic": user.profilePic,
				},
			},
			{ arrayFilters: [{ "reply.userId": userId }] }
		);

		// password should be null in response
		user.password = null;

		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in updateUser: ", err.message);
	}
};
const getUsers = async (req, res) => {
	try {
		const userId = req.user._id;

        // Check if the user exists
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(401).json({ error: "Unauthorized: User not found." });
        }

        // Fetch all users from the database, excluding the password field
        const allUsers = await User.find({}, { password: 0 });

        res.status(200).json(allUsers);
	
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
const getSuggestedUsers = async (req, res) => {
	try {
		// exclude the current user from suggested users array and exclude users that current user is already following
		const userId = req.user._id;

		const usersFollowedByYou = await User.findById(userId).select("following");

		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},
			{
				$sample: { size: 10 },
			},
		]);
		const filteredUsers = users.filter((user) => !usersFollowedByYou.following.includes(user._id));
		const suggestedUsers = filteredUsers.slice(0, 4);

		suggestedUsers.forEach((user) => (user.password = null));
        
		res.status(200).json(suggestedUsers);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const getFollowers = async (req, res) => {
    try {
        const userId = req.params.id;

        // Find users who are following the specified user
        const followers = await User.find({ following: userId }).select("-password");

        res.status(200).json(followers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const getFollowing = async (req, res) => {
    try {
        const userId = req.params.id;

        // Find users who are following the specified user
        const following = await User.find({ followers: userId }).select("-password");
       
        res.status(200).json(following);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const freezeAccount = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user) {
			return res.status(400).json({ error: "User not found" });
		}

		user.isFrozen = true;
		await user.save();

		res.status(200).json({ success: true });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
 const requestPasswordReset = async (req, res) => {
	const { email } = req.body;
  
	try {
	  const user = await User.findOne({ email });
	  if (!user) {
		return res.status(404).json({ message: 'User with this email does not exist' });
	  }
  
	  // Generate reset token
	  const resetToken = crypto.randomBytes(32).toString('hex');
	  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
	  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes
	  await user.save();
  
	  // Reset URL (e.g., `http://localhost:3000/password-reset/:token`)
	  const resetURL = `${req.protocol}://${req.get('host')}/password-reset/${resetToken}`;
  
	  // Send the reset email
	  await sendPasswordResetEmail(user.email, resetURL);
  
	  res.status(200).json({ message: 'Password reset email sent successfully' });
	} catch (error) {
	  res.status(500).json({ message: 'An error occurred, please try again' });
	}
  };
  
 const resetPassword = async (req, res) => {
	const { token } = req.params;
	const { newPassword } = req.body;
  
	try {
	  // Hash the token and find the user
	  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
	  const user = await User.findOne({
		resetPasswordToken: hashedToken,
		resetPasswordExpires: { $gt: Date.now() },
	  });
  
	  if (!user) {
		return res.status(400).json({ message: 'Token is invalid or has expired' });
	  }
  
	  // Update password
	  const salt = await bcrypt.genSalt(10);
	  user.password = await bcrypt.hash(newPassword, salt);
	  user.resetPasswordToken = undefined;
	  user.resetPasswordExpires = undefined;
	  await user.save();
  
	  res.status(200).json({ message: 'Password has been reset' });
	} catch (error) {
	  res.status(500).json({ message: 'An error occurred, please try again' });
	}
  };
   const sendPasswordResetEmail = async (email, resetURL) => {
	const transporter = nodemailer.createTransport({
	  service: 'gmail',
	  auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	  },
	});
  
	const mailOptions = {
	  from: process.env.EMAIL_USER,
	  to: email,
	  subject: 'Password Reset Request',
	  html: `<p>You requested a password reset.</p><p>Click <a href="${resetURL}">here</a> to reset your password.</p>`,
	};
  
	await transporter.sendMail(mailOptions);
  };
export {
	signupUser,
	loginUser,
	logoutUser,
	followUnFollowUser,
	updateUser,
	getUserProfile,
	getSuggestedUsers,
	freezeAccount,
	getUsers,
	getFollowers,
	getFollowing,
	verifyEmail,sendVerificationEmail,resetPassword ,requestPasswordReset 
};
