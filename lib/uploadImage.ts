import { supabase } from "./supabase";

export async function uploadImage(file: File, bucketName: string = "product-images"): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error: any) {
    console.error("Storage upload error:", error.message);
    throw error;
  }
}
