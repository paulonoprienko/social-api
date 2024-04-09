const { prisma } = require("../prisma/prisma-client");

const FollowController = {
  followUser: async (req, res) => {
    const userId = req.user.userId;
    const { followingId } = req.body;

    if (followingId === userId) {
      return res.status(400).json({ error: "Can't subscribe to yourself" });
    }

    try {
      const existedSubscription = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId }],
        },
      });

      if (existedSubscription) {
        return res.status(400).json({ error: "Subscription already exists" });
      }

      // await prisma.follows.create({
      //   data: {
      //     follower: { connect: { id: userId } },
      //     following: { connect: { id: followingId } },
      //   },
      // });

      await prisma.follows.create({
        data: {
          followerId: userId,
          followingId: followingId,
        },
      });

      res
        .status(201)
        .json({ message: "Subscription was created successfully" });
    } catch (error) {
      console.error("Error in followUser", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  unfollowUser: async (req, res) => {
    const userId = req.user.userId;
    const { followingId } = req.params;

    try {
      const existedSubscription = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId }],
        },
      });

      if (!existedSubscription) {
        return res
          .status(400)
          .json({ error: "You are not following this user" });
      }

      await prisma.follows.delete({
        where: {
          id: existedSubscription.id,
        },
      });

      res.status(201).json({ message: "Subscription canceled successfully" });
    } catch (error) {
      console.error("Error in unfollowUser", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = FollowController;
