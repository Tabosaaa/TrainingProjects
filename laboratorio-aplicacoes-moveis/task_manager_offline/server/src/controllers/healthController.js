/**
 * Health Controller
 * 
 * Controller para verificação de saúde da API.
 */

/**
 * Health check endpoint
 */
function check(req, res) {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    message: 'Task Manager API is running'
  });
}

module.exports = {
  check
};





