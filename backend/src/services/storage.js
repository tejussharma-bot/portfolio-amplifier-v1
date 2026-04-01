const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { put } = require("@vercel/blob");

const { isPlaceholderValue } = require("../utils/config");

const uploadDir = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

let ensuredSupabaseBucket = null;

function sanitizeFileName(value) {
  return String(value || "asset")
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isBlobConfigured() {
  return (
    !!process.env.BLOB_READ_WRITE_TOKEN &&
    !isPlaceholderValue(process.env.BLOB_READ_WRITE_TOKEN)
  );
}

function isSupabaseStorageConfigured() {
  return (
    !!process.env.SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !isPlaceholderValue(process.env.SUPABASE_URL) &&
    !isPlaceholderValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

function getSupabaseBucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET || "project-assets";
}

function getSupabaseClient() {
  if (!isSupabaseStorageConfigured()) {
    return null;
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function ensureSupabaseBucket() {
  const bucketName = getSupabaseBucketName();

  if (ensuredSupabaseBucket === bucketName) {
    return bucketName;
  }

  const client = getSupabaseClient();

  if (!client) {
    return null;
  }

  const { data: buckets, error: listError } = await client.storage.listBuckets();

  if (listError) {
    throw listError;
  }

  const exists = (buckets || []).some((bucket) => bucket.name === bucketName);

  if (!exists) {
    const { error: createError } = await client.storage.createBucket(bucketName, {
      public: true
    });

    if (createError && !String(createError.message || "").includes("already exists")) {
      throw createError;
    }
  }

  ensuredSupabaseBucket = bucketName;
  return bucketName;
}

async function storeProjectAsset({ file, userId, projectId, index }) {
  const safeName = sanitizeFileName(file.originalname || `asset-${index + 1}`);
  const fileKey = `${Date.now()}-${index + 1}-${safeName}`;

  if (isSupabaseStorageConfigured()) {
    const client = getSupabaseClient();
    const bucketName = await ensureSupabaseBucket();
    const storagePath = `projects/${userId}/${projectId}/${fileKey}`;

    const { error: uploadError } = await client.storage
      .from(bucketName)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = client.storage.from(bucketName).getPublicUrl(storagePath);

    return {
      storage: "supabase",
      bucket: bucketName,
      originalName: file.originalname,
      path: storagePath,
      url: data.publicUrl,
      mimetype: file.mimetype,
      size: file.size
    };
  }

  if (isBlobConfigured()) {
    const blob = await put(`projects/${userId}/${projectId}/${fileKey}`, file.buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return {
      storage: "blob",
      originalName: file.originalname,
      pathname: blob.pathname,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      mimetype: file.mimetype,
      size: file.size
    };
  }

  const localFileName = `${projectId}-${fileKey}`;
  const localPath = path.join(uploadDir, localFileName);
  await fs.promises.writeFile(localPath, file.buffer);

  return {
    storage: "local",
    originalName: file.originalname,
    path: `/uploads/${localFileName}`,
    url: `/uploads/${localFileName}`,
    mimetype: file.mimetype,
    size: file.size
  };
}

module.exports = {
  storeProjectAsset
};
