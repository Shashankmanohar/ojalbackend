import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (fileInput, folder = "products") => {
  if (!fileInput) throw new Error("File input is required");

  try {
    let result;
    
    // Check if fileInput is a buffer (memory storage) or a path (disk storage)
    if (Buffer.isBuffer(fileInput)) {
      // Memory storage - upload buffer directly using upload_stream
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "auto",
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(fileInput);
      });
    } else {
      // Disk storage - upload from file path
      result = await cloudinary.uploader.upload(fileInput, {
        folder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
      });

      // delete local file after upload
      try {
        await fs.unlink(fileInput);
      } catch (unlinkError) {
        console.warn("Could not delete local file:", unlinkError.message);
      }
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    // ensure cleanup for disk storage
    if (typeof fileInput === 'string') {
      try {
        await fs.unlink(fileInput);
      } catch (_) {}
    }

    throw error; // let controller handle response
  }
};

export default uploadCloudinary;


