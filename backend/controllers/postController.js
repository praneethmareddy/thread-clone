import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

const createPost = async (req, res) => {
    try {
        const { postedBy, text } = req.body;
        let { img } = req.body;

        if (!postedBy || !text) {
            return res.status(400).json({ error: "Postedby and text fields are required" });
        }

        const user = await User.findById(postedBy);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "Unauthorized to create post" });
        }

        const maxLength = 500;
        if (text.length > maxLength) {
            return res.status(400).json({ error: `Text must be less than ${maxLength} characters` });
        }

        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        // Create new post
        const newPost = new Post({ postedBy, text, img });
        await newPost.save();

        // After saving the post, update the external model
        const updateModelResponse = await fetch('https://ml-api-dwdv.onrender.com/update_model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                posted_by: postedBy.toString()
            })
        });

        if (!updateModelResponse.ok) {
            throw new Error('Failed to update the model');
        }

        res.status(201).json(newPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err);
    }
};
const repost = async (req, res) => {
	try {
		const { postedBy, text ,img} = req.body;
		

		if (!postedBy || !text) {
			return res.status(400).json({ error: "Postedby and text fields are required" });
		}

		const user = await User.findById(postedBy);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		if (user._id.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to create post" });
		}

		const maxLength = 500;
		if (text.length > maxLength) {
			return res.status(400).json({ error: `Text must be less than ${maxLength} characters` });
		}

		

		const newPost = new Post({ postedBy, text, img });
		await newPost.save();

		res.status(201).json(newPost);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log(err);
	}
};

const getPost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		res.status(200).json(post);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};


const deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		if (post.postedBy.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to delete post" });
		}

		if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		}

		await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const likeUnlikePost = async (req, res) => {
	try {
		const { id: postId } = req.params;
		const userId = req.user._id;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const userLikedPost = post.likes.includes(userId);

		if (userLikedPost) {
			// Unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			res.status(200).json({ message: "Post unliked successfully" });
		} else {
			// Like post
			post.likes.push(userId);
			await post.save();
			res.status(200).json({ message: "Post liked successfully" });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const replyToPost = async (req, res) => {
	try {
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user._id;
		const userProfilePic = req.user.profilePic;
		const username = req.user.username;

		if (!text) {
			return res.status(400).json({ error: "Text field is required" });
		}

		const post = await Post.findById(postId);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const reply = { userId, text, userProfilePic, username };

		post.replies.push(reply);
		await post.save();

		res.status(200).json(reply);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const getFeedPosts = async (req, res) => {
    try {
        const userId = req.user._id; // Get the current user's ID
        const user = await User.findById(userId).select('following'); // Only select the following field

        // Check if the user exists
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const following = user.following; // Get the list of users the current user is following

        // Fetch feed posts from the users the current user is following
        const feedPostsPromise = Post.find({ postedBy: { $in: following } })
            .sort({ createdAt: -1 })
            .limit(20) // Limit the number of feed posts for efficiency
            .select('_id postedBy text img createdAt likes replies'); // Project only necessary fields

        // Fetch recommended post IDs from the external API
        const recommendationPromise = fetch('https://ml-api-dwdv.onrender.com/recommend_posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId.toString(),
                top_n: 5
            })
        }).then(response => {
            if (!response.ok) throw new Error('Failed to fetch recommended posts');
            return response.json();
        });

        // Wait for both promises to resolve
        const [feedPosts, recommendationData] = await Promise.all([feedPostsPromise, recommendationPromise]);

        // Get the recommended post IDs (assuming the API returns an array of recommendations with 'postId')
        const recommendedPostIds = recommendationData.recommendations.map(rec => rec.postId);

        // Fetch recommended posts from the database using the post IDs
        const recommendedPosts = await Post.find({ _id: { $in: recommendedPostIds } })
            .select('_id postedBy text img createdAt likes replies') // Fetch the same fields as feed posts
            .sort({ createdAt: -1 }); // Sort by creation date if necessary

        // Combine feed posts and recommended posts
        const combinedPosts = [...feedPosts, ...recommendedPosts];

        // Use a Map to ensure uniqueness of posts based on postId
        const postMap = new Map();

        combinedPosts.forEach(post => {
            if (post._id && !postMap.has(post._id)) {
                postMap.set(post._id, post); // Add to map if not already present
            }
        });

        // Convert the map values back to an array
        const uniquePosts = Array.from(postMap.values());

        // Sort the unique posts based on creation time (most recent first)
        uniquePosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Send combined posts as the response
        res.status(200).json(uniquePosts);
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
        console.error(err);
    }
};







const getUserPosts = async (req, res) => {
	const { username } = req.params;
	try {
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });
      
		res.status(200).json(posts);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
const getUserRepliedPosts = async (req, res) => {
	const { username } = req.params;
	try {
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		const posts = await Post.find({ "replies.userId": user._id });

		// if (!posts ) {
		// 	return res.status(404).json({ error: "No posts found for this user's replies" });
		// }
       console.log(posts);
		res.status(200).json(posts);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

export { repost,createPost, getPost, deletePost, likeUnlikePost, replyToPost, getFeedPosts, getUserPosts,getUserRepliedPosts };
