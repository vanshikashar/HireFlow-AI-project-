
import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { z } from "zod";

import { requireAuth } from "../middleware/auth.js";
import { analyzeResume } from "../services/resume.js";

const router = Router();

const MAX_PDF_SIZE = 5 * 1024 * 1024;
const MIN_RESUME_TEXT_LENGTH = 50;
const MAX_JOB_DESCRIPTION_LENGTH = 20_000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PDF_SIZE,
    files: 1,
    fields: 1,
    fieldSize: MAX_JOB_DESCRIPTION_LENGTH,
  },
});

const jobDescriptionSchema = z.object({
  jobDescription: z
    .string()
    .trim()
    .min(50, "Job description must be at least 50 characters.")
    .max(
      MAX_JOB_DESCRIPTION_LENGTH,
      "Job description must be 20,000 characters or fewer.",
    ),
});

function handleUpload(req: Request, res: Response, next: NextFunction) {
  upload.single("resume")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          message: "Resume PDF must be 5 MB or smaller.",
        });
        return;
      }

      res.status(400).json({
        message: "Invalid upload. Upload one PDF and a job description.",
      });
      return;
    }

    next(error);
  });
}

router.post(
  "/analyze",
  requireAuth,
  handleUpload,
  async (req: Request, res: Response) => {
    const parsedInput = jobDescriptionSchema.safeParse(req.body);

    if (!parsedInput.success) {
      return res.status(400).json({
        message: "Invalid job description.",
        errors: parsedInput.error.flatten(),
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Please attach a PDF file using the field name "resume".',
      });
    }

    // Do not trust the browser's filename or MIME type alone.
    const signature = req.file.buffer.subarray(0, 5).toString("ascii");

    if (signature !== "%PDF-") {
      return res.status(415).json({
        message: "The uploaded file does not appear to be a valid PDF.",
      });
    }

    let parser: PDFParse | undefined;
    let resumeText = "";

    try {
      parser = new PDFParse({ data: req.file.buffer });

      const result = await parser.getText();
      resumeText = result.text.trim();
    } catch {
      return res.status(422).json({
        message:
          "Unable to read this PDF. It may be damaged, encrypted, or unsupported.",
      });
    } finally {
      if (parser) {
        try {
          await parser.destroy();
        } catch {
          // Ignore cleanup errors; no uploaded file is stored on disk.
        }
      }
    }

    if (resumeText.length < MIN_RESUME_TEXT_LENGTH) {
      return res.status(422).json({
        message:
          "Not enough readable text was found. If this is a scanned image, use an OCR-enabled PDF before analyzing it.",
      });
    }

    if (resumeText.length > 100_000) {
      return res.status(413).json({
        message: "The extracted resume text is too long to analyze.",
      });
    }

    const report = analyzeResume(
      resumeText,
      parsedInput.data.jobDescription,
    );

    return res.json({
      report,
    });
  },
);

export default router;
