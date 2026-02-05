import fs from "fs";
import dotenv from "dotenv";
import axios from "axios";
import FormData from "form-data";
import crypto from "crypto";

dotenv.config();

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

// ✅ Create Cloudinary signature (SHA1) for signed upload
const signCloudinaryParams = (params, apiSecret) => {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  return crypto.createHash("sha1").update(sorted + apiSecret).digest("hex");
};

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    if (!fs.existsSync(localFilePath)) {
      console.log("❌ File not found:", localFilePath);
      return null;
    }

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    const timestamp = Math.floor(Date.now() / 1000);

    // ✅ Add any params you want to use (keep minimal for stability)
    const paramsToSign = {
      timestamp,
      // folder: "uploads", // optional
    };

    const signature = signCloudinaryParams(paramsToSign, API_SECRET);

    const form = new FormData();
    form.append("file", fs.createReadStream(localFilePath));
    form.append("api_key", API_KEY);
    form.append("timestamp", timestamp);
    form.append("signature", signature);

    // optional (must be included in signature if you add it)
    // form.append("folder", "uploads");

    const response = await axios.post(url, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 300000, // 5 minutes
    });

    // ✅ Cloudinary response structure is similar to SDK response
    console.log("file is uploaded on cloudinary ", response.data.secure_url);

    return response.data;
  } catch (error) {
    // ⚠️ Keep same behavior: return null on failure
    const errData = error?.response?.data || error?.message || error;
    console.log("❌ Cloudinary Upload Error:", errData);

    // ✅ Optional: remove local file if you want cleanup
    fs.unlinkSync(localFilePath);

    return null;
  }
};

export { uploadOnCloudinary };
