export default function getEnv(env: "DEV" | "STAGE" | "PROD") {
  switch (env) {
    case "DEV":
      return {
        SERVER_URL: "http://localhost:4000/",
        WS_SERVER_URL: "ws://localhost:4000/",
      };
    case "STAGE":
      return {
        SERVER_URL: "http://localhost:4000/",
        WS_SERVER_URL: "ws://localhost:4000/",
      };
    case "PROD":
      return {
        SERVER_URL: "http://localhost:4000/",
        WS_SERVER_URL: "ws://localhost:4000/",
      };
    default:
      return {
        SERVER_URL: "http://localhost:4000/",
        WS_SERVER_URL: "ws://localhost:4000/",

        // SERVER_URL: "http://localhost:8001/",
        // WS_SERVER_URL: "ws://localhost:8001/",
      };
  }
}
