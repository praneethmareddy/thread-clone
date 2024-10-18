import { Box, Container } from "@chakra-ui/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import UserPage from "./pages/UserPage";
import PostPage from "./pages/PostPage";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import { useRecoilValue } from "recoil";
import userAtom from "./atoms/userAtom";
import UpdateProfilePage from "./pages/UpdateProfilePage";
import CreatePost from "./components/CreatePost";
import ChatPage from "./pages/ChatPage";
import { SettingsPage } from "./pages/SettingsPage";
import Followers from "./components/Followers";
import Followings from "./components/Followings";
import  VerifyEmail from "./components/VerifyEmail";
import ForgotPassword from "./components/ForgotPassword"
import ResetPassword from "./components/ResetPassword"

const isJwtCookiePresent = () => {
	return document.cookie.split(';').some((cookie) => cookie.trim().startsWith('jwt='));
};

// Main App component
function App() {
	const user = useRecoilValue(userAtom);
	const { pathname } = useLocation();

	const isAuthenticated = () => {
		let v = isJwtCookiePresent();
console.log(`this is ${v}`);

		return isJwtCookiePresent() && !!user;
	};

	return (
		<Box position={"relative"} w="full">
			<Container maxW={pathname === "/" ? { base: "620px", md: "900px" } : "620px"}>
				<Header />
				<Routes>
					<Route path="/" element={isAuthenticated() ? <HomePage /> : <Navigate to="/auth" />} />
					<Route path="/auth" element={!isAuthenticated() ? <AuthPage /> : <Navigate to="/" />} />
					<Route path="/update" element={isAuthenticated() ? <UpdateProfilePage /> : <Navigate to="/auth" />} />
					<Route path="/followers/:id" element={isAuthenticated() ? <Followers /> : <Navigate to="/auth" />} />
					<Route path="/following/:id" element={isAuthenticated() ? <Followings /> : <Navigate to="/auth" />} />
					<Route
						path="/:username"
						element={
							isAuthenticated() ? (
								<>
									<UserPage />
									<CreatePost />
								</>
							) : (
								<UserPage />
							)
						}
					/>
					 <Route path="/forgot-password" element={<ForgotPassword />} />
          
                    <Route path="/password-reset/:token" element={<ResetPassword />} />
					<Route path="/verify-email/:token/:email" element={<VerifyEmail />} />
					<Route path="/:username/post/:pid" element={<PostPage />} />
					<Route path="/chat" element={isAuthenticated() ? <ChatPage /> : <Navigate to="/auth" />} />
					<Route path="/settings" element={isAuthenticated() ? <SettingsPage /> : <Navigate to="/auth" />} />
				</Routes>
			</Container>
		</Box>
	);
}

export default App;
