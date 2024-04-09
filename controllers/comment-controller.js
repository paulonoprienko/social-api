const { prisma } = require("../prisma/prisma-client");

const CommentController = {
  createComment: async (req, res) => {
    const userId = req.user.userId;
    const { content, postId } = req.body;

    if (!content || !postId) {
      return res.status(400).json({ error: "All fields required" });
    }

    try {
      const comment = await prisma.comment.create({
        data: {
          postId,
          userId,
          content,
        },
      });

      res.json(comment);
    } catch (error) {
      console.error("Error in createComment", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  deleteComment: async (req, res) => {
    const userId = req.user.userId;
    const { id: commentId } = req.params;

    try {
      const comment = await prisma.comment.findUnique({
        where: {
          id: commentId,
        },
      });

      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      if (comment.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await prisma.comment.delete({
        where: { id: commentId },
      });

      res.json(comment);
    } catch (error) {
      console.error("Error in deleteComment", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = CommentController;
