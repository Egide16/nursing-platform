import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generateCertificatePdf(opts: {
  studentName: string;
  courseTitle: string;
  issuedAt: Date;
  expiresAt: Date;
  certId: string;
  issuingAuthority: string;
  requiresExternalLicense: boolean;
  licenseNumber: string | null;
}) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([792, 612]); // landscape letter
  const { width, height } = page.getSize();

  const serif = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifRegular = await doc.embedFont(StandardFonts.TimesRoman);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  const ink = rgb(0.11, 0.17, 0.19);
  const teal = rgb(0.18, 0.29, 0.25);
  const gold = rgb(0.71, 0.51, 0.18);
  const slate = rgb(0.42, 0.45, 0.47);

  // Border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: gold,
    borderWidth: 2,
  });

  const centerText = (text: string, y: number, font = sans, size = 12, color = ink) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
  };

  centerText(opts.issuingAuthority.toUpperCase(), height - 90, sans, 12, teal);
  centerText("CERTIFICATE OF COMPLETION", height - 130, sans, 11, slate);
  centerText("This certifies that", height - 190, serifRegular, 13, slate);
  centerText(opts.studentName, height - 230, serif, 30, ink);
  centerText("has successfully completed", height - 270, serifRegular, 13, slate);
  centerText(opts.courseTitle, height - 305, serif, 20, teal);
  if (opts.issuingAuthority !== "Knowledge Cornerstone") {
    centerText("training administered by Knowledge Cornerstone", height - 325, sans, 9, slate);
  }

  const dateFmt = (d: Date) =>
    d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  centerText(`Issued ${dateFmt(opts.issuedAt)}   \u00b7   Expires ${dateFmt(opts.expiresAt)}`, height - 360, sans, 11, ink);
  centerText(`Certificate ID ${opts.certId}`, 70, sans, 9, slate);

  if (opts.requiresExternalLicense) {
    const licenseText = opts.licenseNumber
      ? `${opts.issuingAuthority} License #${opts.licenseNumber}`
      : `${opts.issuingAuthority} license number pending`;
    centerText(licenseText, 88, sans, 9, slate);
  }

  return doc.save();
}
