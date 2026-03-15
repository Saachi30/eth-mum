import React, { useState } from 'react';
import { Star, Heart, ShoppingCart, Tag } from 'lucide-react';
import productsData from './amazon-products.json';

const ShoppingTracker = () => {
  const [hoveredId, setHoveredId] = useState(null);

  const RatingStars = ({ rating }) => {
    if (rating === 'N/A') return <span className="text-gray-400">No Rating</span>;
    
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star 
            key={i} 
            className="w-4 h-4 fill-yellow-400 text-yellow-400"
          />
        ))}
        {hasHalfStar && (
          <div className="relative w-4 h-4">
            <Star className="absolute w-4 h-4 text-yellow-400" />
            <div className="absolute w-2 h-4 overflow-hidden">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        <span className="ml-1 text-sm text-gray-600">{rating}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="container mx-auto">
        <h1 
          className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-fade-in"
        >
          Eco-Friendly Products
        </h1>
        <p 
          className="text-center text-gray-600 mb-8 animate-fade-in"
        >
          Discover sustainable alternatives for everyday items
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {productsData.map((product, index) => (
            <div
              key={index}
              className="opacity-0 animate-fade-slide-up"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              <div 
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                onMouseEnter={() => setHoveredId(index)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="relative pt-[100%] overflow-hidden">
                  <img 
                    src={product.imageUrl || "/api/placeholder/400/320"}
                    alt={product.name || "Product image"}
                    className="absolute top-0 left-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button 
                      className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-red-50 transition-colors duration-300 hover:scale-110 active:scale-90"
                    >
                      <Heart className="w-5 h-5 text-red-500" />
                    </button>
                    <button 
                      className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-blue-50 transition-colors duration-300 hover:scale-110 active:scale-90"
                    >
                      <ShoppingCart className="w-5 h-5 text-blue-500" />
                    </button>
                  </div>
                  {product.isEco && (
                    <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      Eco-friendly
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-lg mb-2 text-gray-800 line-clamp-2">
                    {product.name || "Sustainable Product"}
                  </h3>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-2xl font-bold text-blue-600">{product.price}</span>
                    <RatingStars rating={product.rating} />
                  </div>
                  <a 
                    href={product.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-102 active:scale-98"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShoppingTracker;