import { createRoot } from "react-dom/client";
import { ChatApp } from "./ChatApp";
import { MockAgentConnector } from "./connector/MockAgentConnector";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <ChatApp
    config={{
      agentConnector: MockAgentConnector,
      title: "Chat App Dev",
      welcomeMessage: "Dev playground loaded. Try typing something.",
      theme: {
        brandColor: "#cc0000",
        brandColorHover: "#aa0000",
        brandColorSubtle: "rgba(204, 0, 0, 0.15)",
        brandColorText: "#ff4444",
      },
    }}
  />
);
