const { prisma } = require("../prisma/prisma-client");
const bcrypt = require("bcryptjs");
const Jdenticon = require("jdenticon");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const UserController = {
  register: async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const existedUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existedUser) {
        return res.status(400).json({ error: "User is already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const png = Jdenticon.toPng(name, 200);
      const avatarName = `${name}_${Date.now()}.png`;
      const avatarPath = path.join(__dirname, "../uploads", avatarName);
      fs.writeFileSync(avatarPath, png);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          avatarUrl: `/uploads/${avatarName}`,
        },
      });

      res.json(user);
    } catch (error) {
      console.error("Error in register", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "All fields are required" });
    }

    try {
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      const isPasswordCorrect =
        user && (await bcrypt.compare(password, user.password));
      const secret = process.env.JWT_SECRET;

      if (!user || !isPasswordCorrect || !secret) {
        return res.status(400).json({ error: "user or password is incorrect" });
      }

      res.status(200).json({
        id: user.id,
        username: user.name,
        token: jwt.sign({ userId: user.id }, secret, { expiresIn: "30d" }),
      });
    } catch (error) {
      console.error("Error in login", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  getUserById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    // if (!id) {
    //   return res.status(400).json({ error: "" });
    // }

    try {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
        include: {
          followers: true,
          following: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isFollowing = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId: id }],
        },
      });

      res.status(200).json({ ...user, isFollowing: !!isFollowing });
    } catch (error) {
      console.error("Error in getUserById", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  updateUser: async (req, res) => {
    const { id } = req.params;
    const { email, name, dateOfBirth, bio, location } = req.body;

    console.log(id, email, name, dateOfBirth, bio, location);

    let filePath;

    if (req.file && req.file.path) {
      filePath = req.file.path;
    }

    if (id !== req.user.userId) {
      return res.status(403).json({ error: "Not access" });
    }

    try {
      if (email) {
        const existedUser = await prisma.user.findFirst({
          where: {
            email,
          },
        });

        if (existedUser && existedUser.id !== id) {
          return res.status(400).json({ error: "Email is already used" });
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          email: email || undefined,
          name: name || undefined,
          avatarUrl: filePath ? `/${filePath}` : undefined,
          dateOfBirth: dateOfBirth || undefined,
          bio: bio || undefined,
          location: location || undefined,
        },
      });

      res.json(user);
    } catch (error) {
      console.error("Error in updateUser", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  current: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user.userId,
        },
        include: {
          followers: {
            include: {
              follower: true,
            },
          },
          following: {
            include: {
              following: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Get current user Error", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = UserController;
