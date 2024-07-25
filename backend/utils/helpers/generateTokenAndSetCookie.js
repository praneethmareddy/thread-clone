import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "15d",
	});

	res.cookie("jwt", token, {
		httpOnly: true, // more secure
		maxAge: Number.MAX_SAFE_INTEGER, // effectively infinite
		sameSite: "strict", // CSRF
	});

	return token;
};

export default generateTokenAndSetCookie;
