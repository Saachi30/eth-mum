// const FAQ = () => {
//     const faqs = [
//       {
//         q: "What are Renewable Energy Credits (RECs)?",
//         a: "RECs are market-based instruments that represent the environmental benefits of renewable electricity generation."
//       },
//       {
//         q: "How does blockchain improve REC trading?",
//         a: "Blockchain provides transparency, reduces fraud, and enables instant verification of renewable energy certificates."
//       }
//       // More FAQs...
//     ];
  
//     return (
//       <section className="mb-12">
//         <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
//         <div className="space-y-4">
//           {faqs.map((faq, i) => (
//             <details key={i} className="bg-white rounded-lg p-4">
//               <summary className="font-bold cursor-pointer">{faq.q}</summary>
//               <p className="mt-2 text-gray-600">{faq.a}</p>
//             </details>
//           ))}
//         </div>
//       </section>
//     );
//   };
// export default FAQ;  

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  
  const faqs = [
    {
      q: "What are Renewable Energy Credits (RECs)?",
      a: "Renewable Energy Credits (RECs) are market-based instruments that represent the environmental benefits of renewable electricity generation. Each REC represents one megawatt-hour (MWh) of renewable electricity generated and delivered to the grid. They provide a way to track and trade the environmental attributes of clean energy production.",
      icon: "🏷️"
    },
    {
      q: "How does blockchain improve REC trading?",
      a: "Blockchain technology enhances REC trading by providing transparent, immutable records of renewable energy generation and transactions. It eliminates double-counting, reduces fraud, enables real-time verification, and streamlines the trading process through smart contracts.",
      icon: "⛓️"
    },
    {
      q: "What equipment do I need to start converting waste to energy?",
      a: "The required equipment depends on your chosen conversion method. For biogas, you'll need an anaerobic digester. For biomass combustion, you'll need a biomass boiler. Basic monitoring equipment and safety gear are essential for all methods.",
      icon: "🔧"
    },
    {
      q: "How much can I earn from agricultural waste conversion?",
      a: "Earnings vary based on your farm size, waste volume, and chosen conversion method. On average, farmers can generate additional income of $3,000-$10,000 annually through energy sales and reduced operating costs.",
      icon: "💰"
    },
    {
      q: "What are the environmental benefits of waste-to-energy?",
      a: "Waste-to-energy conversion reduces greenhouse gas emissions, minimizes landfill waste, improves soil health through biochar application, and helps combat climate change by replacing fossil fuels with renewable energy sources.",
      icon: "🌱"
    }
  ];

  return (
    <section className="mb-12">
      <h2 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-green-500">
        Frequently Asked Questions
      </h2>
      <div className="space-y-4 max-w-3xl mx-auto">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={false}
            animate={{ backgroundColor: activeIndex === index ? 'rgb(243, 244, 246)' : 'white' }}
            className="rounded-xl shadow-sm overflow-hidden"
          >
            <motion.button
              className="w-full px-6 py-4 flex items-center justify-between text-left"
              onClick={() => setActiveIndex(activeIndex === index ? null : index)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{faq.icon}</span>
                <span className="font-semibold">{faq.q}</span>
              </div>
              <motion.span
                animate={{ rotate: activeIndex === index ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-gray-500"
              >
                ↓
              </motion.span>
            </motion.button>
            
            <AnimatePresence>
              {activeIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 py-4 text-gray-600 border-t">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;