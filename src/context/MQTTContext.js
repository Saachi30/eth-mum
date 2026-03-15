import React, { createContext, useContext } from 'react';
import { useMQTT } from '../hooks/useMQTT';

const MQTTContext = createContext();

const BROKER_URL = "wss://broker.hivemq.com:8884/mqtt";

export const MQTTProvider = ({ children }) => {
  const { connected, publish } = useMQTT({
    brokerUrl: BROKER_URL,
    options: {
      clientId: "react_client_" + Math.random().toString(16).substring(2, 8),
    },
    topics: ["energy/init", "energy/event1", "energy/event2"],
  });

  return (
    <MQTTContext.Provider value={{ connected, publish }}>
      {children}
    </MQTTContext.Provider>
  );
};

export const useMQTTContext = () => {
  const context = useContext(MQTTContext);
  if (!context) {
    throw new Error("useMQTTContext must be used within an MQTTProvider");
  }
  return context;
};
