const express = require('express');
const router = express.Router();
const ollamaService = require('../services/ollamaService');
const { authenticateUser } = require('../middleware/auth');

// Check Local Ollama Engine status & discovered models
router.get('/status', async (req, res) => {
  try {
    const activeModel = await ollamaService.getAvailableModel();
    res.json({
      success: true,
      data: {
        ollamaRunning: !!activeModel,
        activeModel: activeModel || 'No local models detected',
        configuredModel: process.env.OLLAMA_MODEL || 'deepseek-r1:8b',
        endpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        mode: 'Local Edge AI / Local DeepSeek'
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        ollamaRunning: false,
        activeModel: null,
        mode: 'Local Edge AI',
        error: error.message
      }
    });
  }
});

module.exports = router;
