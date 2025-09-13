// scripts/generate-icons.js
import sharp from "sharp";
import fs from "fs";
import path from "path";

// Input: your base logo (ideally big or SVG, e.g. 1024x1024)
// Put your source logo inside ./public/icons/logo.png
const inputFile = path.resolve("public/icons/logo.png");

// Output directory for generated icons
const outputDir = path.resolve("public/icons");

// Standard PWA sizes (can add more if you want)
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

(async () => {
  try {
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Input file not found: ${inputFile}`);
      process.exit(1);
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const size of sizes) {
      const outFile = path.join(outputDir, `notification-icon-${size}.png`);
      await sharp(inputFile)
        .resize(size, size)
        .png()
        .toFile(outFile);

      console.log(`✅ Generated ${outFile}`);
    }

    console.log("🎉 All icons generated successfully!");
  } catch (err) {
    console.error("❌ Error generating icons:", err);
    process.exit(1);
  }
})();
