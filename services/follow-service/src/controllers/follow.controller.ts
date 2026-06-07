const Follow = require('../models/follow.model');

module.exports = {

    addFollow: async (req, res) => {
        const { followerId, followingId } = req.params;
        const newFollow = new Follow({ followerId, followingId });
        await newFollow.save();
        res.status(201).json(newFollow);
    },

    unfollow: async (req, res) => {
        const { followerId, followingId } = req.params;
        await Follow.findOneAndDelete({ followerId, followingId });
        res.status(200).json({ message: 'Unfollowed successfully' });
    },

    getFollowing: async (req, res) => {
        const { id } = req.params;
        const following = await Follow.find({ followerId: id });
        res.status(200).json(following);
    },

    getFollowers: async (req, res) => {
        const { id } = req.params;
        const followers = await Follow.find({ followingId: id });
        res.status(200).json(followers);
    },

};