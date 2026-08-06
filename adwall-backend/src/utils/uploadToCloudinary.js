const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// Multer buffer ko Cloudinary pe upload karne ka helper
// folder param se hum organize karenge: kyc/aadhaar, kyc/pan, kyc/selfie
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `adwall/${folder}`,
        resource_type: "auto", // image ya pdf dono handle karega
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;
