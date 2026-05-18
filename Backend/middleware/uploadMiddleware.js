import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

const getCloudinaryCredentials = () => ({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
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

    const credentials = getCloudinaryCredentials();
    const missingCredentials = Object.entries(credentials)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingCredentials.length > 0) {
      return res.status(500).json({
        success: false,
        message: `Cloudinary credentials are missing on server: ${missingCredentials.join(", ")}`,
      });
    }

    cloudinary.config(credentials);

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
      message: `Failed to upload image to Cloudinary: ${error.message}`,
    });
  }
};

const upload = {
  single: (fieldName) => [multerUpload.single(fieldName), uploadToCloudinary],
};

export default upload;
