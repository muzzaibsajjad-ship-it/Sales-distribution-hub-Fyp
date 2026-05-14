import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only images allowed"), false);
};

const multerUpload = multer({ storage, fileFilter });

const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) return next();

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary credentials are missing on server",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "sales-hub/proofs",
          resource_type: "image",
        },
        (error, uploaded) => {
          if (error) reject(error);
          else resolve(uploaded);
        }
      );

      Readable.from([req.file.buffer]).pipe(uploadStream);
    });

    req.file.filename = result.secure_url;
    req.file.path = result.secure_url;
    req.file.cloudinary = {
      public_id: result.public_id,
      secure_url: result.secure_url,
    };

    next();
  } catch (error) {
    console.error("Cloudinary upload failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to upload image to Cloudinary",
    });
  }
};

const upload = {
  single: (fieldName) => [multerUpload.single(fieldName), uploadToCloudinary],
};

export default upload;
