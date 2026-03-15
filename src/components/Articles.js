import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Replace with your actual NewsAPI key
  const NEWS_API_KEY = '64416b065d9a418d9687b7f2b4c79695';
  
  // Sustainability-related search terms (Random Selection)
  const searchQueries = [
    'sustainable energy',
    'renewable energy',
    // 'solar energy',
    // 'wind energy',
    'energy production',
    'green energy',
    'sustainable energy agriculture',
    'renewable energy farming',
    'agricultural waste energy',
    'energy production companies',
    'green energy agriculture',
    'biomass energy farming',
    'sustainable energy production',
    'renewable energy production',
    
  ];
  
  // Function to fetch articles
  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
  
    try {
      // Randomly select a search query
      const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];
      
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: `${randomQuery} AND ( green energy OR sustainable energy OR renewable energy certificate OR agricultural waste energy )`,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 6, // Match your current grid layout
          apiKey: NEWS_API_KEY
        }
      });
  
      // Filter and format the articles
      const validArticles = response.data.articles.filter(article =>
        article.urlToImage &&
        article.title &&
        article.description &&
        !article.title.includes('[Removed]') &&
        !article.description.includes('[Removed]')
      ).map((article) => ({
        title: article.title,
        excerpt: article.description,
        url: article.url,
        imageUrl: article.urlToImage,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt).toLocaleDateString(),
      }));
  
      setArticles(validArticles.slice(0, 6)); // Limit to 6 articles
    } catch (err) {
      setError('Failed to fetch articles. Please try again later.');
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch news initially and set an interval to update every 30 minutes
  useEffect(() => {
    fetchArticles();
    const interval = setInterval(fetchArticles, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, []);
  

  const cardVariants = {
    hidden: (index) => {
      if (index % 3 === 0) return { opacity: 0, x: -150 }; // Left cards
      if (index % 3 === 2) return { opacity: 0, x: 150 }; // Right cards
      return { opacity: 0, y: -100 }; // Middle cards
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 60,
        damping: 15,
        delay: 0.2,
      },
    },
  };

  if (loading) {
    return (
      <section className="mb-12">
        <h2 className="text-7xl font-extrabold mb-6">Latest Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm p-6 animate-pulse"
            >
              <div className="h-48 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Latest Articles</h2>
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-6">Latest Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, i) => (
          <motion.article
            key={i}
            className="bg-white rounded-xl shadow-sm overflow-hidden transition-transform duration-100 hover:scale-110 hover:shadow-2xl hover:border-2 hover:border-gray-400"
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariants}
          >
            {article.imageUrl && (
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold mb-3">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  {article.title}
                </a>
              </h3>
              <p className="text-gray-600 mb-4">{article.excerpt}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{article.source}</span>
                <span>{article.publishedAt}</span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default Articles;

// import React from 'react';

// const articles = [
//   {
//     title: "5 Ways Renewable Energy is Transforming Agriculture",
//     excerpt: "Discover how renewable energy sources like solar and biogas are revolutionizing the agricultural sector, making it more sustainable and efficient.",
//   },
//   {
//     title: "The Role of Technology in Reducing Agricultural Waste",
//     excerpt: "Learn about cutting-edge technologies that help minimize waste in farming practices and promote circular economies.",
//   },
//   {
//     title: "Top 10 Crops Suitable for Biomass Energy Production",
//     excerpt: "Explore the most efficient crops for biomass energy production and their potential impact on renewable energy goals.",
//   },
//   {
//     title: "How to Create a Sustainable Farm with Green Energy",
//     excerpt: "A step-by-step guide to integrating green energy solutions into your farm operations to improve sustainability.",
//   },
//   {
//     title: "The Economics of Agricultural Waste Conversion",
//     excerpt: "Understand the financial benefits of converting agricultural waste into energy and how it can boost farmers' incomes.",
//   },
//   {
//     title: "Biogas Basics: Turning Farm Waste into Energy",
//     excerpt: "An introductory guide to biogas production from farm waste, highlighting its benefits and the steps involved.",
//   },
// ];

// const Articles = () => (
//   <section className="mb-12">
//     <h2 className="text-3xl font-bold mb-6">Latest Articles</h2>
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//       {articles.map((article, i) => (
//         <article key={i} className="bg-white rounded-xl shadow-sm p-6">
//           <h3 className="text-xl font-bold mb-3">{article.title}</h3>
//           <p className="text-gray-600">{article.excerpt}</p>
//         </article>
//       ))}
//     </div>
//   </section>
// );

// export default Articles;
