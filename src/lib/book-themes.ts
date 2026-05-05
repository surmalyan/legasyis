// Book theme styles for PDF export
export type BookTheme = "classic" | "modern" | "vintage";

export interface BookThemeConfig {
  id: BookTheme;
  nameRu: string;
  nameEn: string;
  descRu: string;
  descEn: string;
  emoji: string;
  coverBg: string;
  coverOverlay: string;
  bodyFont: string;
  headingFont: string;
  textColor: string;
  headingColor: string;
  accentColor: string;
  mutedColor: string;
  borderColor: string;
  ornamentStyle: string;
  chapterNumStyle: string;
  tocDotColor: string;
  backCoverBg: string;
  fontImport: string;
}

export const bookThemes: Record<BookTheme, BookThemeConfig> = {
  classic: {
    id: "classic",
    nameRu: "Классика",
    nameEn: "Classic",
    descRu: "Тёплые тона, элегантные засечки",
    descEn: "Warm tones, elegant serifs",
    emoji: "📜",
    coverBg: "linear-gradient(160deg, #f7f3ee 0%, #e8ddd0 40%, #c4a882 100%)",
    coverOverlay: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(180,150,110,0.3) 0%, transparent 50%)",
    bodyFont: "'Source Sans 3', 'Segoe UI', sans-serif",
    headingFont: "'Cormorant Garamond', serif",
    textColor: "#3d3530",
    headingColor: "#2d2520",
    accentColor: "#c4a882",
    mutedColor: "#8b7d6b",
    borderColor: "#f0ebe4",
    ornamentStyle: "linear-gradient(90deg, transparent, #8b7355, transparent)",
    chapterNumStyle: "#b4966e",
    tocDotColor: "#e5ddd0",
    backCoverBg: "linear-gradient(160deg, #f7f3ee 0%, #e8ddd0 100%)",
    fontImport: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Sans+3:wght@300;400;500;600&display=swap",
  },
  modern: {
    id: "modern",
    nameRu: "Модерн",
    nameEn: "Modern",
    descRu: "Минимализм, чистые линии",
    descEn: "Minimalism, clean lines",
    emoji: "✨",
    coverBg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    coverOverlay: "radial-gradient(ellipse at 50% 30%, rgba(233,196,106,0.15) 0%, transparent 60%)",
    bodyFont: "'Inter', 'Helvetica Neue', sans-serif",
    headingFont: "'Playfair Display', serif",
    textColor: "#374151",
    headingColor: "#111827",
    accentColor: "#e9c46a",
    mutedColor: "#6b7280",
    borderColor: "#e5e7eb",
    ornamentStyle: "linear-gradient(90deg, transparent, #e9c46a, transparent)",
    chapterNumStyle: "#e9c46a",
    tocDotColor: "#e5e7eb",
    backCoverBg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    fontImport: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap",
  },
  vintage: {
    id: "vintage",
    nameRu: "Винтаж",
    nameEn: "Vintage",
    descRu: "Состаренная бумага, ретро-шрифты",
    descEn: "Aged paper, retro typography",
    emoji: "🕰️",
    coverBg: "linear-gradient(170deg, #f5e6c8 0%, #e6d2a8 40%, #c9a96e 100%)",
    coverOverlay: "radial-gradient(ellipse at 40% 30%, rgba(255,248,230,0.5) 0%, transparent 60%), radial-gradient(ellipse at 60% 70%, rgba(160,120,60,0.2) 0%, transparent 50%)",
    bodyFont: "'EB Garamond', 'Georgia', serif",
    headingFont: "'Cinzel', serif",
    textColor: "#4a3728",
    headingColor: "#2c1810",
    accentColor: "#8b6914",
    mutedColor: "#7a6b5a",
    borderColor: "#ddd0b8",
    ornamentStyle: "linear-gradient(90deg, transparent, #8b6914, transparent)",
    chapterNumStyle: "#8b6914",
    tocDotColor: "#ddd0b8",
    backCoverBg: "linear-gradient(170deg, #f5e6c8 0%, #e6d2a8 100%)",
    fontImport: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap",
  },
};

export function generateBookStyles(theme: BookThemeConfig): string {
  const isModern = theme.id === "modern";
  const coverTextColor = isModern ? "#f9fafb" : theme.headingColor;
  const coverSubtitleColor = isModern ? "rgba(255,255,255,0.7)" : theme.mutedColor;
  const coverAuthorColor = isModern ? "#e9c46a" : theme.headingColor;
  const coverYearColor = isModern ? "rgba(255,255,255,0.5)" : theme.mutedColor;
  const coverLogoColor = isModern ? "#e9c46a" : theme.accentColor;
  const backTextColor = isModern ? "#f9fafb" : theme.mutedColor;
  const backTaglineColor = isModern ? "rgba(255,255,255,0.6)" : theme.mutedColor;

  return `
    @import url('${theme.fontImport}');
    
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: ${theme.bodyFont};
      color: ${theme.textColor};
      background: #fff;
      font-size: 13px;
      line-height: 1.8;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .cover {
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: ${theme.coverBg};
      text-align: center;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }
    .cover::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: ${theme.coverOverlay};
    }
    .cover-content { position: relative; z-index: 1; padding: 40px; }
    .cover-ornament {
      width: 80px;
      height: 2px;
      background: ${theme.ornamentStyle};
      margin: 0 auto 32px;
    }
    .cover-logo {
      font-family: ${theme.headingFont};
      font-size: 16px;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: ${coverLogoColor};
      margin-bottom: 48px;
    }
    .cover-title {
      font-family: ${theme.headingFont};
      font-size: ${isModern ? "48px" : "52px"};
      font-weight: ${isModern ? "700" : "300"};
      color: ${coverTextColor};
      line-height: 1.2;
      margin-bottom: 12px;
    }
    .cover-subtitle {
      font-family: ${theme.headingFont};
      font-size: 22px;
      font-weight: 400;
      font-style: italic;
      color: ${coverSubtitleColor};
      margin-bottom: 48px;
    }
    .cover-author {
      font-family: ${theme.headingFont};
      font-size: 28px;
      font-weight: 500;
      color: ${coverAuthorColor};
      letter-spacing: 2px;
    }
    .cover-year {
      font-size: 14px;
      color: ${coverYearColor};
      margin-top: 40px;
      letter-spacing: 3px;
    }
    .cover-ornament-bottom {
      width: 120px;
      height: 1px;
      background: ${theme.ornamentStyle};
      margin: 24px auto 0;
    }

    .toc-page {
      padding: 80px 60px;
      page-break-after: always;
      min-height: 100vh;
    }
    .toc-heading {
      font-family: ${theme.headingFont};
      font-size: 32px;
      font-weight: 600;
      color: ${theme.headingColor};
      text-align: center;
      margin-bottom: 48px;
    }
    .toc-heading::after {
      content: '';
      display: block;
      width: 60px;
      height: 2px;
      background: ${theme.ornamentStyle};
      margin: 16px auto 0;
    }
    .toc-item {
      display: flex;
      align-items: baseline;
      padding: 12px 0;
      border-bottom: 1px dotted ${theme.tocDotColor};
    }
    .toc-chapter {
      font-family: ${theme.headingFont};
      font-size: 14px;
      color: ${theme.mutedColor};
      width: 80px;
      flex-shrink: 0;
    }
    .toc-title {
      font-family: ${theme.headingFont};
      font-size: 20px;
      font-weight: 500;
      color: ${theme.headingColor};
    }

    .author-page {
      padding: 80px 60px;
      page-break-after: always;
      min-height: 100vh;
    }
    .author-heading {
      font-family: ${theme.headingFont};
      font-size: 28px;
      font-weight: 600;
      color: ${theme.headingColor};
      text-align: center;
      margin-bottom: 40px;
    }
    .author-heading::after {
      content: '';
      display: block;
      width: 60px;
      height: 2px;
      background: ${theme.ornamentStyle};
      margin: 16px auto 0;
    }
    .profile-field {
      display: flex;
      padding: 14px 0;
      border-bottom: 1px solid ${theme.borderColor};
    }
    .profile-field .label {
      font-weight: 600;
      color: ${theme.mutedColor};
      width: 180px;
      flex-shrink: 0;
      font-size: 13px;
    }
    .profile-field .value {
      color: ${theme.textColor};
      font-size: 14px;
      line-height: 1.6;
    }

    .chapter-page {
      padding: 60px;
      page-break-before: always;
    }
    .chapter-header {
      text-align: center;
      margin-bottom: 40px;
      padding-top: 40px;
    }
    .chapter-num {
      font-family: ${theme.headingFont};
      font-size: 14px;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: ${theme.chapterNumStyle};
    }
    .chapter-title {
      font-family: ${theme.headingFont};
      font-size: 36px;
      font-weight: 600;
      color: ${theme.headingColor};
      margin-top: 8px;
      line-height: 1.3;
    }
    .chapter-divider {
      width: 60px;
      height: 2px;
      background: ${theme.ornamentStyle};
      margin: 20px auto 0;
    }
    .chapter-text {
      font-size: 14px;
      line-height: 1.9;
      color: ${theme.textColor};
      text-align: justify;
      max-width: 600px;
      margin: 0 auto;
    }

    .back-cover {
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: ${theme.backCoverBg};
      text-align: center;
      page-break-before: always;
    }
    .back-logo {
      font-family: ${theme.headingFont};
      font-size: 24px;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: ${backTextColor};
      margin-bottom: 16px;
    }
    .back-tagline {
      font-family: ${theme.headingFont};
      font-size: 16px;
      font-style: italic;
      color: ${backTaglineColor};
    }

    @media print {
      body { margin: 0; }
      .cover, .back-cover { height: 100vh; }
      .chapter-page { break-inside: avoid-page; }
    }

    /* ===== Title page photo ===== */
    .cover-photo {
      display: block;
      width: 200px;
      height: 260px;
      object-fit: cover;
      margin: 0 auto 28px;
      border-radius: 4px;
      border: 6px solid ${isModern ? "rgba(255,255,255,0.08)" : "#fff"};
      box-shadow: 0 12px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15);
      background: ${theme.borderColor};
    }
    .cover-photo-placeholder {
      background: repeating-linear-gradient(
        45deg,
        ${theme.borderColor},
        ${theme.borderColor} 8px,
        ${theme.tocDotColor} 8px,
        ${theme.tocDotColor} 16px
      );
    }
    .cover-years {
      font-family: ${theme.headingFont};
      font-size: 18px;
      letter-spacing: 4px;
      color: ${coverSubtitleColor};
      margin-top: 8px;
    }

    /* ===== Photo placeholder inside chapters ===== */
    .photo-placeholder {
      max-width: 480px;
      margin: 36px auto 24px;
      text-align: center;
    }
    .photo-frame {
      width: 100%;
      aspect-ratio: 4 / 3;
      border: 1px dashed ${theme.mutedColor};
      border-radius: 4px;
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        ${theme.borderColor} 10px,
        ${theme.borderColor} 11px
      );
    }
    .photo-placeholder figcaption {
      font-family: ${theme.headingFont};
      font-style: italic;
      font-size: 12px;
      color: ${theme.mutedColor};
      margin-top: 10px;
      letter-spacing: 1px;
    }

    /* ===== Memory Circle contributions at chapter end ===== */
    .circle-section {
      max-width: 600px;
      margin: 40px auto 0;
      padding-top: 24px;
      border-top: 1px solid ${theme.borderColor};
    }
    .circle-heading {
      font-family: ${theme.headingFont};
      font-size: 18px;
      font-weight: 600;
      color: ${theme.headingColor};
      text-align: center;
      margin-bottom: 20px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .circle-memory {
      border-left: 3px solid ${theme.accentColor};
      padding: 8px 16px 8px 18px;
      margin: 14px 0;
      background: ${isModern ? "rgba(0,0,0,0.02)" : theme.borderColor + "55"};
      border-radius: 0 4px 4px 0;
    }
    .circle-title {
      font-family: ${theme.headingFont};
      font-weight: 600;
      font-size: 14px;
      color: ${theme.headingColor};
      margin-bottom: 4px;
    }
    .circle-text {
      font-size: 13px;
      line-height: 1.7;
      color: ${theme.textColor};
      font-style: italic;
    }

    /* ===== Voice Library (QR codes) ===== */
    .voice-page {
      padding: 80px 60px;
      page-break-before: always;
      min-height: 100vh;
    }
    .voice-heading {
      font-family: ${theme.headingFont};
      font-size: 32px;
      font-weight: 600;
      color: ${theme.headingColor};
      text-align: center;
      margin-bottom: 8px;
    }
    .voice-heading::after {
      content: '';
      display: block;
      width: 60px;
      height: 2px;
      background: ${theme.ornamentStyle};
      margin: 16px auto 0;
    }
    .voice-intro {
      text-align: center;
      font-size: 13px;
      color: ${theme.mutedColor};
      font-style: italic;
      margin: 24px auto 36px;
      max-width: 420px;
    }
    .voice-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      max-width: 600px;
      margin: 0 auto;
    }
    .voice-item {
      text-align: center;
      padding: 16px;
      border: 1px solid ${theme.borderColor};
      border-radius: 6px;
      background: ${isModern ? "rgba(0,0,0,0.02)" : "#fff"};
      break-inside: avoid;
    }
    .voice-qr {
      width: 140px;
      height: 140px;
      display: block;
      margin: 0 auto 10px;
    }
    .voice-title {
      font-family: ${theme.headingFont};
      font-size: 12px;
      color: ${theme.headingColor};
      letter-spacing: 1px;
    }
  `;
}
