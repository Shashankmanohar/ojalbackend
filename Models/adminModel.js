import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    adminName: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [20, "Name must be under 20 characters"]
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      minlength: [8, "Email must be at least 8 characters"],
      maxlength: [40, "Email must be under 40 characters"],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address"
      ]
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [5, "Password must be at least 5 characters"],
      select: false 
    },

    role: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Admin", AdminSchema);
