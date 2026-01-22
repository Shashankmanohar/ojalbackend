import multer from "multer";
import fs from "fs";
import path from "path";

// Check if we're in a serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';

let storage;

if (isServerless) {
  // Use memory storage for serverless environments (files are uploaded to Cloudinary immediately)
  storage = multer.memoryStorage();
} else {
  // Use disk storage for local development
  const uploadDir = path.join(process.cwd(), "Public", "Temp");
  
  // Try to create directory, but don't fail if it already exists or can't be created
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (error) {
    console.warn("Could not create upload directory, falling back to memory storage:", error.message);
    storage = multer.memoryStorage();
  }

  if (!storage) {
    storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix =
          Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);

        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
      },
    });
  }
}

export const upload = multer({ storage });
