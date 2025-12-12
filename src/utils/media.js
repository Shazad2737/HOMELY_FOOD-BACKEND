import fs from "fs";
import {
  imageKitMediaUpload,
  imageKitMediaDeleteByUrl,
} from "../../adaptors/imageKit.adaptor.js";
import { logger } from "../utils/logger.js";
import { envConfig } from "../../config/env.js";

export const uploadMedia = async (
  fileContent,
  folder,
  fileInfo,
  options = {}
) => {
  try {
    const provider = envConfig.general.MEDIA_PROVIDER;

    // Convert buffer to base64 if needed
    let base64Content = fileContent;
    if (Buffer.isBuffer(fileContent)) {
      base64Content = fileContent.toString("base64");
    } else if (fileInfo?.path && fs.existsSync(fileInfo.path)) {
      base64Content = fs.readFileSync(fileInfo.path, {
        encoding: "base64",
      });
    }

    let result = null;

    // Select provider
    if (provider.toLowerCase() === "imagekit") {
      result = await imageKitMediaUpload(
        base64Content,
        folder,
        fileInfo,
        options
      );
    } else {
      // Add more providers as needed
      throw new Error(`Unsupported media provider: ${provider}`);
    }

    return result;
  } catch (error) {
    logger.error(`Media upload error: ${error.message}`);
    return null;
  }
};

export const deleteMedia = async (url) => {
  try {
    const provider = envConfig.general.MEDIA_PROVIDER;

    if (provider.toLowerCase() === "imagekit") {
      return await imageKitMediaDeleteByUrl(url);
    } else {
      throw new Error(`Unsupported media provider: ${provider}`);
    }
  } catch (error) {
    logger.error(`Media deletion error: ${error.message}`);
    return false;
  }
};

export const cleanupTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      logger.error(`Failed to clean up temp file: ${error.message}`);
    }
  }
};
