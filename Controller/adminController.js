import adminModel from "../Models/adminModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/* =========================
   ADMIN REGISTER
========================= */

export const adminRegister = async (req, res) => {
  try {
    const { adminName, email, password } = req.body;

    if (!adminName || !email || !password) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Password strength
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingAdmin = await adminModel.findOne({
      email: email.toLowerCase(),
    });

    if (existingAdmin) {
      return res.status(409).json({ message: "Admin already exists!" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newAdmin = await adminModel.create({
      adminName,
      email: email.toLowerCase(),
      password: hashPassword,
    });

    return res.status(201).json({
      message: "Admin created successfully",
      admin: {
        _id: newAdmin._id.toString(),
        adminName: newAdmin.adminName,
        email: newAdmin.email,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt,
        updatedAt: newAdmin.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =========================
   ADMIN LOGIN
========================= */

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const admin = await adminModel
      .findOne({ email: email.toLowerCase() })
      .select("+password");

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // JWT TOKEN
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        _id: admin._id.toString(),
        adminName: admin.adminName,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
