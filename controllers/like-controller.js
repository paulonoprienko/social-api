const { prisma } = require("../prisma/prisma-client");

const LikeController = {
  likePost: async (req, res) => {
    const userId = req.user.userId;
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: "postId is required" });
    }

    try {
      const existedLike = await prisma.like.findFirst({
        where: { postId, userId },
      });

      if (existedLike) {
        return res.status(400).json({ error: "This post is already liked" });
      }

      const like = await prisma.like.create({
        data: { postId, userId },
      });

      res.json(like);
    } catch (error) {
      console.error("Error in likePost", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  unlikePost: async (req, res) => {
    const userId = req.user.userId;
    const { id: postId } = req.params;

    if (!postId) {
      return res.status(400).json({ error: "postId is required" });
    }

    try {
      const existedLike = await prisma.like.findFirst({
        where: { postId, userId },
      });

      if (!existedLike) {
        return res
          .status(400)
          .json({ error: "This post is already not liked" });
      }

      const like = await prisma.like.deleteMany({
        where: { id: existedLike.id, postId, userId },
      });

      res.json(like);
    } catch (error) {
      console.error("Error in unlikePost", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = LikeController;
