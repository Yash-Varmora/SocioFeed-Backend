import cloudinary from '../configs/cloudinary.config.js';

const uploadImage = async (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result);
      })
      .end(fileBuffer);
  });
};

const deleteImage = async publicId => {
  return cloudinary.uploader.destroy(publicId);
};

export { uploadImage, deleteImage };
