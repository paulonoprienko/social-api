const { prisma } = require("../prisma/prisma-client");

const PostController = {
  createPost: async (req, res) => {
    const authorId = req.user.userId;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const post = await prisma.post.create({
        data: {
          content,
          authorId,
        },
      });

      res.json(post);
    } catch (error) {
      console.error("Error in createPost", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  getAllPosts: async (req, res) => {
    const userId = req.user.userId;

    try {
      const posts = await prisma.post.findMany({
        include: {
          author: true,
          comments: true,
          likes: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const postsWithLikeInfo = posts.map((post) => ({
        ...post,
        likedByUser: post.likes.some((like) => like.userId === userId),
      }));

      res.json(postsWithLikeInfo);
    } catch (error) {
      console.error("Error in getAllPosts", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  getPostById: async (req, res) => {
    const userId = req.user.userId;
    const { id: postId } = req.params;

    try {
      const post = await prisma.post.findUnique({
        where: {
          id: postId,
        },
        include: {
          comments: {
            include: {
              user: true,
            },
          },
          author: true,
          likes: true,
        },
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const postWithLikeInfo = {
        ...post,
        likedByUser: post.likes.some((like) => like.userId === userId),
      };

      res.json(postWithLikeInfo);
    } catch (error) {
      console.error("Error in getPostById", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  deletePost: async (req, res) => {
    const userId = req.user.userId;
    const { id: postId } = req.params;
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (post.authorId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const transaction = await prisma.$transaction([
        prisma.comment.deleteMany({
          where: { id: postId },
        }),
        prisma.like.deleteMany({
          where: { id: postId },
        }),
        prisma.post.delete({
          where: { id: postId },
        }),
      ]);

      res.json(transaction);
    } catch (error) {
      console.error("Error in deletePost", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = PostController;
