import multer from "multer";
import fs from "fs";
import path from "path";

// Default to memory storage - safe for all environments
let storage = multer.memoryStorage();

// Check if we're in a serverless environment (Vercel, AWS Lambda, etc.)
// Vercel sets VERCEL=1, and we should never try to write to disk there
const isServerless = process.env.VERCEL === '1' || 
                     process.env.VERCEL === 'true' || 
                     process.env.AWS_LAMBDA_FUNCTION_NAME ||
                     process.env.VERCEL_ENV;

// Only try disk storage if we're NOT in a serverless environment
if (!isServerless) {
  try {
    const uploadDir = path.join(process.cwd(), "Public", "Temp");
    
    // Try to create directory - if this fails, we'll keep memory storage
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // If directory creation succeeded, use disk storage for local development
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
    console.log("Using disk storage (local development)");
  } catch (error) {
    // If directory creation fails, keep memory storage (already set as default)
    console.warn("Could not create upload directory, using memory storage:", error.message);
  }
} else {
  console.log("Using memory storage (serverless environment detected)");
}

export const upload = multer({ storage });
