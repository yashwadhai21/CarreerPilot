import { NextRequest, NextResponse } from "next/server"
import { analyzeResumeText } from "@/lib/resume-parser"

// Force Node.js runtime for Buffer, pdf-parse, mammoth
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 })
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Please upload PDF, DOC, DOCX, or TXT." },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let extractedText = ""

    // ── PDF Extraction ──
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse")
        const data = await pdfParse(buffer)
        extractedText = data.text || ""
      } catch (pdfErr) {
        console.error("PDF parse error:", pdfErr)
        return NextResponse.json(
          { success: false, error: "Could not read PDF. Please ensure it is not password-protected." },
          { status: 422 }
        )
      }
    }

    // ── DOCX Extraction ──
    else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx")
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mammoth = require("mammoth")
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value || ""
      } catch (docxErr) {
        console.error("DOCX parse error:", docxErr)
        return NextResponse.json(
          { success: false, error: "Could not read DOCX file." },
          { status: 422 }
        )
      }
    }

    // ── DOC / TXT Extraction ──
    else {
      extractedText = buffer.toString("utf-8")
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: "Could not extract enough text from the file. Try a different format." },
        { status: 422 }
      )
    }

    // Run heuristic NLP analysis
    const analysis = analyzeResumeText(extractedText)

    return NextResponse.json({ success: true, data: analysis })
  } catch (error) {
    console.error("[/api/resume/analyze] Error:", error)
    return NextResponse.json(
      { success: false, error: "Analysis failed. Please try again." },
      { status: 500 }
    )
  }
}
