const Organization = require('../models/Organization');

const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API Key required' });
  }

  try {
    const organization = await Organization.findOne({ apiKey });

    if (!organization) {
      return res.status(403).json({ error: 'Invalid API Key' });
    }

    // Attach organization to request for downstream use
    req.organization = organization;
    next();
  } catch (error) {
    console.error('API Key Auth Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = apiKeyAuth;

