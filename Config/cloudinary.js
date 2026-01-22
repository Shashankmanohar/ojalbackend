import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (localPath, folder = "products") => {
  if (!localPath) throw new Error("Local path is required");

  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder,
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
    });

    // delete local file after upload
    await fs.unlink(localPath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    // ensure cleanup
    try {
      await fs.unlink(localPath);
    } catch (_) {}

    throw error; // let controller handle response
  }
};

export default uploadCloudinary;


