import Product from "../Models/productModel.js";
import uploadCloudinary from "../Config/cloudinary.js";
import cloudinary from "cloudinary";


export const addProduct = async (req, res) => {
  try {
    // Support both frontend field names (name, imageUrl, inStock) and backend names (title, stock)
    const {
      name,
      title,
      description,
      price,
      originalPrice,
      stock,
      inStock,
      category,
      subcategory,
      imageUrl,
      isNew,
      isBestseller
    } = req.body;

    const productTitle = name || title;
    const productStock = inStock !== undefined ? (inStock ? 100 : 0) : (stock || 0);

    if (!productTitle || !description || !price || !category) {
      return res.status(400).json({ message: "Name, description, price, and category are required!" });
    }

    let images = [];

    // Handle image upload - support both file upload and URL
    if (req.files && req.files.length > 0) {
      // File upload via multer
      // Handle both memory storage (buffer) and disk storage (path)
      const uploadedImages = await Promise.all(
        req.files.map((file) => {
          // Memory storage provides buffer, disk storage provides path
          const fileInput = file.buffer || file.path;
          return uploadCloudinary(fileInput, "products");
        })
      );

      images = uploadedImages.map((img) => ({
        cloudinaryUrl: img.url,
        cloudinaryPublicId: img.publicId,
      }));
    } else if (imageUrl) {
      // URL-based image (from frontend)
      images = [{
        cloudinaryUrl: imageUrl,
        cloudinaryPublicId: `url_${Date.now()}`, // Placeholder ID for URL-based images
      }];
    }

    const product = await Product.create({
      title: productTitle,
      description,
      price: parseFloat(price),
      stock: parseInt(productStock),
      category,
      subcategory: subcategory || undefined,
      images,
      isActive: inStock !== undefined ? inStock : true,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({
      message: "Product creation failed",
      error: error.message
    });
  }
};

export const getAllproduct = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};



export const getOneproduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};


export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      title,
      description,
      price,
      originalPrice,
      stock,
      inStock,
      category,
      subcategory,
      imageUrl
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update fields - support both frontend and backend field names
    product.title = name || title || product.title;
    product.description = description || product.description;
    product.price = price ? parseFloat(price) : product.price;
    product.stock = inStock !== undefined ? (inStock ? 100 : 0) : (stock ? parseInt(stock) : product.stock);
    product.category = category || product.category;
    product.subcategory = subcategory || product.subcategory;
    product.isActive = inStock !== undefined ? inStock : product.isActive;

    // Handle image updates
    if (req.files && req.files.length > 0) {
      // Delete old images from cloudinary (only if they're actual cloudinary images)
      for (let img of product.images) {
        if (img.cloudinaryPublicId && !img.cloudinaryPublicId.startsWith('url_')) {
          await cloudinary.v2.uploader.destroy(img.cloudinaryPublicId);
        }
      }

      const uploadedImages = await Promise.all(
        req.files.map((file) => {
          // Memory storage provides buffer, disk storage provides path
          const fileInput = file.buffer || file.path;
          return uploadCloudinary(fileInput, "products");
        })
      );

      product.images = uploadedImages.map((img) => ({
        cloudinaryUrl: img.url,
        cloudinaryPublicId: img.publicId,
      }));
    } else if (imageUrl && imageUrl !== product.images[0]?.cloudinaryUrl) {
      // Update with new URL
      product.images = [{
        cloudinaryUrl: imageUrl,
        cloudinaryPublicId: `url_${Date.now()}`,
      }];
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Product update error:", error);
    res.status(500).json({
      message: "Product update failed",
      error: error.message
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete images from cloudinary (only if they exist and have cloudinaryPublicId)
    if (product.images && Array.isArray(product.images)) {
      for (let img of product.images) {
        // Only delete from Cloudinary if the image has a cloudinaryPublicId
        // (skip URL-based images that don't have this property)
        if (img.cloudinaryPublicId) {
          try {
            await cloudinary.v2.uploader.destroy(img.cloudinaryPublicId);
          } catch (cloudinaryError) {
            console.error("Failed to delete image from Cloudinary:", cloudinaryError);
            // Continue with product deletion even if Cloudinary deletion fails
          }
        }
      }
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Product deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Product deletion failed",
      error: error.message
    });
  }
};
