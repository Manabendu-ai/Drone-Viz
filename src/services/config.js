// ============================================================
//  config.js  — Single source of truth for all env vars.
//  To change IPs/ports/models, edit the .env file in the
//  project root. No code changes needed.
// ============================================================

export const config = {
  // Ollama
  ollamaUrl:   import.meta.env.VITE_OLLAMA_URL   || 'http://localhost:11434',
  ollamaModel: import.meta.env.VITE_OLLAMA_MODEL || 'phi3',

  // ROS
  rosServerIp: import.meta.env.VITE_ROS_SERVER_IP || 'localhost',
  rosWsPort:   import.meta.env.VITE_ROS_WS_PORT   || '9090',
  videoPort:   import.meta.env.VITE_VIDEO_PORT     || '8080',

  // Derived URLs
  get rosWsUrl()    { return `ws://${this.rosServerIp}:${this.rosWsPort}`; },
  get videoUrl()    {
    const topic = import.meta.env.VITE_CAMERA_TOPIC || '/camera/image_raw';
    return `http://${this.rosServerIp}:${this.videoPort}/stream?topic=${encodeURIComponent(topic)}`;
  },

  // Topics
  topicOdom:   import.meta.env.VITE_TOPIC_ODOM    || '/odom',
  topicCmdVel: import.meta.env.VITE_TOPIC_CMD_VEL || '/cmd_vel',

  // Safety limits
  maxLinearVel:  parseFloat(import.meta.env.VITE_MAX_LINEAR_VEL)  || 1.5,
  maxAngularVel: parseFloat(import.meta.env.VITE_MAX_ANGULAR_VEL) || 1.0,
}
