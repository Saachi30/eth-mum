// src/hooks/useMQTT.js
import { useEffect, useState, useRef } from "react";
import mqtt from "mqtt";

export function useMQTT({ brokerUrl, options, topics }) {
  const clientRef = useRef(null);
  const [messages, setMessages] = useState({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (clientRef.current) return; // Prevent double connection in React 19 Strict Mode

    console.log("Attempting MQTT connection to:", brokerUrl);
    
    // Connect with a bit more robust options
    const client = mqtt.connect(brokerUrl, {
      ...options,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });
    
    clientRef.current = client;

    client.on("connect", () => {
      setConnected(true);
      console.log("✅ MQTT Connected successfully");
      if (topics && topics.length > 0) {
        topics.forEach((topic) => {
          client.subscribe(topic);
          console.log("Subscribed to:", topic);
        });
      }
    });

    client.on("message", (topic, payload) => {
      setMessages((prev) => ({
        ...prev,
        [topic]: payload.toString(),
      }));
    });

    client.on("error", (err) => {
      console.error("❌ MQTT Connection Error:", err);
    });

    client.on("close", () => {
      setConnected(false);
      console.log("🔌 MQTT Connection Closed");
    });

    return () => {
      if (clientRef.current) {
        console.log("Cleaning up MQTT connection...");
        clientRef.current.end(true);
        clientRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const publish = (topic, message) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish(topic, message);
      console.log(`Sent: ${message} to ${topic}`);
    } else {
      console.warn("Cannot publish: MQTT not connected");
    }
  };

  return { messages, connected, publish };
}
