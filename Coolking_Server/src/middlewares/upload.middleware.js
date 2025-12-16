const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Tạo thư mục upload nếu chưa tồn tại
const uploadPath = path.join(process.cwd(), 'src', 'tmp', 'my-uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  // console.log('Created upload directory:', uploadPath);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("file");

const uploadd = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).array("files");

const uploadCSVDB = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const filename = file.fieldname + '-' + Date.now() + ext;
      console.log('Uploading file to:', path.join(uploadPath, filename));
      cb(null, filename);
    }
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
}).array("files");

module.exports = { upload, uploadd, uploadCSVDB };