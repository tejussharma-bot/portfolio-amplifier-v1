export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};

export default async function handler(req, res) {
  try {
    const mod = require("../../backend/src/app");
    const app = mod?.default || mod;

    if (typeof app !== "function") {
      throw new Error("Backend app entry did not export a request handler.");
    }

    return app(req, res);
  } catch (error) {
    console.error("API bootstrap failed", error);

    return res.status(500).json({
      error: "API bootstrap failed",
      detail: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
