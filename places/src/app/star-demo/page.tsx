'use client';

import { StarRating, ControlledStarRating } from '@/components/StarRating';
import { useState } from 'react';

export default function StarRatingDemo() {
  const [rating1, setRating1] = useState(0);
  const [rating2, setRating2] = useState(3.5);
  const [formRating, setFormRating] = useState(4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with rating:', formRating);
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Star Rating Component Demo</h1>
      
      {/* Non-interactive ratings (display only) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Display Only (Non-interactive)</h2>
        
        <div className="space-y-2">
          <p>Small size - 4.5 stars:</p>
          <StarRating value={4.5} size="sm" allowHalf />
        </div>
        
        <div className="space-y-2">
          <p>Medium size - 3 stars:</p>
          <StarRating value={3} size="md" />
        </div>
        
        <div className="space-y-2">
          <p>Large size - 2.5 stars:</p>
          <StarRating value={2.5} size="lg" allowHalf />
        </div>
        
        <div className="space-y-2">
          <p>Extra large size - 5 stars:</p>
          <StarRating value={5} size="xl" />
        </div>
      </section>

      {/* Interactive ratings */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Interactive Ratings</h2>
        
        <div className="space-y-2">
          <p>Click to rate (current: {rating1}/5):</p>
          <StarRating 
            value={rating1} 
            interactive 
            onChange={setRating1}
            size="lg"
          />
        </div>
        
        <div className="space-y-2">
          <p>Slider mode (current: {rating2}/5):</p>
          <StarRating 
            value={rating2} 
            interactive 
            onChange={setRating2}
            allowHalf
            size="md"
            sliderMode
          />
        </div>
      </section>

      {/* Form usage */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Form Integration</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Rate this product (slider):
            </label>
            <ControlledStarRating
              value={formRating}
              onChange={setFormRating}
              name="productRating"
              size="lg"
              sliderMode
              allowHalf
            />
          </div>
          
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Submit Rating
          </button>
        </form>
      </section>

      {/* Custom styling example */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Custom Styling</h2>
        
        <div className="space-y-2">
          <p>With custom classes:</p>
          <StarRating 
            value={4} 
            interactive 
            onChange={(rating) => console.log('New rating:', rating)}
            className="p-2 bg-gray-100 rounded-lg"
            size="lg"
          />
        </div>
      </section>
    </div>
  );
}
