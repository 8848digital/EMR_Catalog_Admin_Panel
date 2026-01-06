const path = require('path');
const fs = require('fs/promises');
require('dotenv').config();

const BASE_PATH =
  process.env.isDev == 0
    ? path.join(__dirname, '../public/adCfgImages')
    : path.join(__dirname, '../public/adCfgImages');

// Helper function to generate filename with record ID and image letter
function generateUniqueFilename(originalName, recordId, imageLetter) {
  const ext = path.extname(originalName);
  
  if (recordId && imageLetter) {
    // Format: image_123A.png (where 123 is record ID and A is image letter)
    return `image_${recordId}${imageLetter}${ext}`;
  }
  
  // Fallback for cases without recordId
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `image_${timestamp}_${random}${ext}`;
}

// Helper function to check if file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function uploadFile(req, res, next) {
  try {
    const { files } = req;
    const recordId = req.body.recordId;
    const imageLetter = req.body.imageLetter;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Missing files' });
    }

    if (!recordId || !imageLetter) {
      return res.status(400).json({ error: 'Missing recordId or imageLetter' });
    }

    // Images go directly into /adCfgImages/ (no subfolder)
    const finalDir = BASE_PATH;

    // Create directory if it doesn't exist
    await fs.mkdir(finalDir, { recursive: true });

    const movedFiles = [];

    for (const file of files) {
      const uniqueFilename = generateUniqueFilename(file.originalname, recordId, imageLetter);
      const finalPath = path.join(finalDir, uniqueFilename);

      // If file exists, delete it first (we're replacing)
      if (await fileExists(finalPath)) {
        await fs.unlink(finalPath);
      }

      await fs.copyFile(file.path, finalPath);
      await fs.unlink(file.path);

      movedFiles.push({
        originalName: file.originalname,
        uniqueName: uniqueFilename,
        storedAt: `/adCfgImages/${uniqueFilename}`,
      });
    }

    res.json({
      message: 'Files Uploaded Successfully',
      files: movedFiles,
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ msg: 'Internal server error', error: err.message });
  }
}

async function deleteFile(req, res, next) {
  try {
    const relPath = req.body.path; // e.g., 'image_123A.png'
    if (!relPath) {
      return res.status(400).json({ error: 'Missing path' });
    }

    const absPath = path.join(BASE_PATH, relPath);

    if (!absPath.startsWith(BASE_PATH)) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    try {
      const stat = await fs.stat(absPath);

      if (stat.isDirectory()) {
        await fs.rm(absPath, { recursive: true, force: true });
        return res.json({ message: 'Folder deleted', path: relPath });
      } else if (stat.isFile()) {
        await fs.unlink(absPath);
        return res.json({ message: 'File deleted', path: relPath });
      } else {
        return res.status(400).json({ error: 'Not a file or folder' });
      }
    } catch (statErr) {
      if (statErr.code === 'ENOENT') {
        return res.status(404).json({ error: 'Path not found' });
      }
      throw statErr;
    }
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ msg: 'Internal server error', error: err.message });
  }
}

async function replaceFile(req, res, next) {
  try {
    const { files } = req;
    const { oldFilePath, recordId, imageLetter } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Missing files' });
    }

    if (!recordId || !imageLetter) {
      return res.status(400).json({ error: 'Missing recordId or imageLetter' });
    }

    const finalDir = BASE_PATH;
    await fs.mkdir(finalDir, { recursive: true });

    // Delete old file if it exists
    if (oldFilePath) {
      const pathParts = oldFilePath.split('/adCfgImages/');
      if (pathParts.length >= 2) {
        const relativeOldPath = pathParts[1];
        const absOldPath = path.join(BASE_PATH, relativeOldPath);

        if (absOldPath.startsWith(BASE_PATH)) {
          try {
            await fs.unlink(absOldPath);
            console.log('Old file deleted successfully');
          } catch (err) {
            console.warn('Could not delete old file:', err.message);
          }
        }
      }
    }

    const movedFiles = [];

    for (const file of files) {
      const uniqueFilename = generateUniqueFilename(file.originalname, recordId, imageLetter);
      const finalPath = path.join(finalDir, uniqueFilename);

      // If file exists, delete it first
      if (await fileExists(finalPath)) {
        await fs.unlink(finalPath);
      }

      await fs.copyFile(file.path, finalPath);
      await fs.unlink(file.path);

      movedFiles.push({
        originalName: file.originalname,
        uniqueName: uniqueFilename,
        storedAt: `/adCfgImages/${uniqueFilename}`,
      });
    }

    res.json({
      message: 'File replaced successfully',
      files: movedFiles,
    });
  } catch (err) {
    console.error('Replace file error:', err);
    res.status(500).json({ msg: 'Internal server error', error: err.message });
  }
}

async function getBasePath(req, res, next) {
  return res.json({ basePath: BASE_PATH });
}

module.exports = {
  uploadFile,
  deleteFile,
  replaceFile,
  getBasePath,
};