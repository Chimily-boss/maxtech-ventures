const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

const DATA_DIR = path.join(__dirname, "..", "data");
const ENQUIRIES_FILE = path.join(DATA_DIR, "enquiries.json");

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

/*
   Basic protection against repeated form submissions.
*/
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many enquiries from this connection. Please try again later.",
  },
});

/* =========================================================
   HELPERS
========================================================= */

function cleanText(value, maxLength = 500) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function cleanMessage(value, maxLength = 3000) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(ENQUIRIES_FILE);
  } catch {
    await fs.writeFile(ENQUIRIES_FILE, "[]", "utf8");
  }
}

async function saveEnquiry(enquiry) {
  await ensureDataFile();

  const fileContents = await fs.readFile(
    ENQUIRIES_FILE,
    "utf8"
  );

  let enquiries = [];

  try {
    enquiries = JSON.parse(fileContents);

    if (!Array.isArray(enquiries)) {
      enquiries = [];
    }
  } catch {
    enquiries = [];
  }

  enquiries.push(enquiry);

  await fs.writeFile(
    ENQUIRIES_FILE,
    JSON.stringify(enquiries, null, 2),
    "utf8"
  );
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MAXTECH VENTURES API is running.",
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   CONTACT / REQUEST A QUOTE
========================================================= */

app.post(
  "/api/contact",
  contactLimiter,
  async (req, res) => {
    try {
      const {
        name,
        company,
        email,
        phone,
        service,
        message,
        website,
      } = req.body;

      /* =====================================================
         HONEYPOT
      ===================================================== */

      if (website) {
        console.warn(
          "Honeypot triggered. Possible bot submission."
        );

        return res.status(400).json({
          success: false,
          message: "Unable to process this enquiry.",
        });
      }

      /* =====================================================
         CLEAN INPUT
      ===================================================== */

      const cleanName = cleanText(name, 100);

      const cleanCompany = cleanText(
        company,
        150
      );

      const cleanEmail = cleanText(
        email,
        150
      ).toLowerCase();

      const cleanPhone = cleanText(
        phone,
        50
      );

      const cleanService = cleanText(
        service,
        100
      );

      const cleanEnquiryMessage =
        cleanMessage(message, 3000);

      /* =====================================================
         VALIDATION
      ===================================================== */

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message: "Please enter your full name.",
        });
      }

      if (
        !cleanEmail ||
        !isValidEmail(cleanEmail)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid email address.",
        });
      }

      if (!cleanService) {
        return res.status(400).json({
          success: false,
          message: "Please select a service.",
        });
      }

      if (!cleanEnquiryMessage) {
        return res.status(400).json({
          success: false,
          message: "Please enter your message.",
        });
      }

      /* =====================================================
         ALLOWED SERVICES
      ===================================================== */

      const allowedServices = [
        "printer-sales",
        "printer-repair",
        "maintenance",
        "document-management",
        "parts",
        "other",
      ];

      if (
        !allowedServices.includes(cleanService)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a valid service.",
        });
      }

      /* =====================================================
         CREATE ENQUIRY
      ===================================================== */

      const enquiry = {
        id: `MX-${Date.now()}-${crypto
          .randomBytes(4)
          .toString("hex")}`,

        name: cleanName,

        company: cleanCompany,

        email: cleanEmail,

        phone: cleanPhone,

        service: cleanService,

        message: cleanEnquiryMessage,

        createdAt: new Date().toISOString(),

        status: "new",
      };

      /* =====================================================
         SAVE ENQUIRY
      ===================================================== */

      await saveEnquiry(enquiry);

      console.log(
        `Enquiry ${enquiry.id} saved successfully.`
      );

      /* =====================================================
         RESPONSE
         
         IMPORTANT:
         Web3Forms is handled by the React frontend.
         The backend only validates and saves enquiries.
      ===================================================== */

      return res.status(201).json({
        success: true,

        message:
          "Thank you. Your enquiry has been received successfully.",

        reference: enquiry.id,
      });
    } catch (error) {
      console.error(
        "Contact API error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Something went wrong while processing your enquiry. Please try again.",
      });
    }
  }
);

/* =========================================================
   404 HANDLER
========================================================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {
  console.log("");

  console.log(
    "=============================================="
  );

  console.log(
    "       MAXTECH VENTURES API"
  );

  console.log(
    "=============================================="
  );

  console.log(
    `Server: http://localhost:${PORT}`
  );

  console.log(
    `Health: http://localhost:${PORT}/api/health`
  );

  console.log(
    `Contact: http://localhost:${PORT}/api/contact`
  );

  console.log(
    "=============================================="
  );

  console.log("");

  console.log(
    "Email notifications: handled by frontend Web3Forms"
  );

  console.log("");
});