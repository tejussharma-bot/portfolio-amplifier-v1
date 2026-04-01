import app from "../../backend/src/app";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true
  }
};

export default app;
