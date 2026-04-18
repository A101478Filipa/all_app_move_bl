export const logRequest = (req, _, next) => {
  console.log(`Received request on: ${req.url}`);

  next();
};