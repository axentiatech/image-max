const { createClient } = require("@supabase/supabase-js");
const { readFileSync } = require("fs");
const { join } = require("path");

 
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;


// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadImageToSupabase() {
  try {
    console.log("🚀 Starting image upload to Supabase Storage...");

    // Read the mock image file
    const imagePath = join(
      process.cwd(),
      "..",
      "public",
      "mock-images",
      "mock1.png"
    );
    const imageBuffer = readFileSync(imagePath);

    console.log(`📁 Reading image from: ${imagePath}`);
    console.log(`📊 Image size: ${imageBuffer.length} bytes`);

    // Create a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `mock-image-${timestamp}.png`;

    console.log(`📝 Uploading as: ${fileName}`);

    // Upload to Supabase Storage - use consistent bucket name
    const { data, error } = await supabase.storage
      .from("imagemax") // Your actual bucket name
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ Upload failed:", error.message);
      return;
    }

    console.log("✅ Upload successful!");
    console.log("📋 Upload details:");
    console.log(`   - File: ${data.path}`);
    console.log(`   - Full path: ${data.fullPath}`);
    console.log(`   - ID: ${data.id}`);

    // Get the public URL - use same bucket name
    const { data: publicUrlData } = supabase.storage
      .from("imagemax") // Changed from 'images' to 'imagemax'
      .getPublicUrl(fileName);

    console.log(`🔗 Public URL: ${publicUrlData.publicUrl}`);

    // Test download - use same bucket name
    console.log("\n🧪 Testing file accessibility...");
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from("imagemax") // Changed from 'images' to 'imagemax'
      .download(fileName);

    if (downloadError) {
      console.error("❌ File download test failed:", downloadError.message);
    } else {
      console.log("✅ File is accessible and downloadable");
      console.log(`📊 Downloaded size: ${downloadData.size} bytes`);
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

uploadImageToSupabase();
