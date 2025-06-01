'use client';

import { Star, StarSolid } from 'iconoir-react';
import { Typography } from '@worldcoin/mini-apps-ui-kit-react';
import { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

const sliderStyles = `
  .slider-thumb::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #181818;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }
  
  .slider-thumb::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .slider-thumb::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #717680;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }
  
  .slider-thumb::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .slider-thumb:focus {
    outline: none;
  }
  
  .slider-thumb:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(113, 118, 128, 0.3);
  }
`;

export interface StarRatingProps {
  value?: number;
  interactive?: boolean;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onChange?: (rating: number) => void;
  className?: string;
  allowHalf?: boolean;
  sliderMode?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export const StarRating = ({
  value = 0,
  interactive = false,
  maxStars = 5,
  size = 'md',
  onChange,
  className = '',
  allowHalf = false,
  sliderMode = false,
}: StarRatingProps) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const handleStarClick = (rating: number) => {
    if (interactive && onChange && !sliderMode) {
      MiniKit.commands.sendHapticFeedback({
        hapticsType: 'impact',
        style: 'light'
      });
      onChange(rating);
    }
  };

  const handleStarHover = (rating: number) => {
    if (interactive && !sliderMode) {
      setHoveredRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (interactive && !sliderMode) {
      setHoveredRating(null);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (interactive && onChange && sliderMode) {
      const newValue = parseFloat(e.target.value);
      // Use selection haptic for slider changes
     MiniKit.commands.sendHapticFeedback({
        hapticsType: 'selection-changed',
      });
      onChange(newValue);
    }
  };

  const getStarFill = (starIndex: number): 'empty' | 'half' | 'full' => {
    const currentRating = hoveredRating ?? value;
    
    if (starIndex <= currentRating) {
      return 'full';
    }
    
    if (allowHalf && starIndex === Math.ceil(currentRating) && currentRating % 1 >= 0.5) {
      return 'half';
    }
    
    return 'empty';
  };

  // If slider mode is enabled, render the slider version
  if (sliderMode) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />
        <div className="flex items-center justify-between">
          <Typography className="font-medium text-gray-600">Rating</Typography>
          <Typography className="font-semibold">{value.toFixed(1)}/5</Typography>
        </div>
        
        
        {/* Star display for slider mode */}
        <div className="flex items-center gap-1 justify-center">
          {Array.from({ length: maxStars }, (_, index) => {
            const starNumber = index + 1;
            const fillType = getStarFill(starNumber);
            
            return (
              <div key={index} className="relative">
                {fillType === 'full' ? (
                  <StarSolid 
                    className={`${sizeClasses[size]} text-yellow-400`}
                  />
                ) : fillType === 'half' ? (
                  <div className="relative">
                    <Star 
                      className={`${sizeClasses[size]} text-gray-300`}
                    />
                    <div 
                      className="absolute inset-0 overflow-hidden" 
                      style={{ width: '50%' }}
                    >
                      <StarSolid 
                        className={`${sizeClasses[size]} text-yellow-400`}
                      />
                    </div>
                  </div>
                ) : (
                  <Star 
                    className={`${sizeClasses[size]} text-gray-300`}
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* Custom slider with Worldcoin UI styling */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max={maxStars}
            step={allowHalf ? "0.5" : "1"}
            value={value}
            onChange={handleSliderChange}
            disabled={!interactive}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #b1b8c2 0%, #b1b8c2 ${(value / maxStars) * 100}%, #e5e7eb ${(value / maxStars) * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>
      </div>
    );
  }

  // Original clickable stars mode

  const stars = Array.from({ length: maxStars }, (_, index) => {
    const starNumber = index + 1;
    const fillType = getStarFill(starNumber);
    
    return (
      <button
        key={index}
        type="button"
        disabled={!interactive}
        className={`
          relative transition-colors duration-200
          ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
          ${interactive ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded' : ''}
          disabled:cursor-default
        `}
        onClick={() => handleStarClick(starNumber)}
        onMouseEnter={() => handleStarHover(starNumber)}
        onMouseLeave={handleMouseLeave}
        aria-label={`${starNumber} star${starNumber !== 1 ? 's' : ''}`}
      >
        {fillType === 'full' ? (
          <StarSolid 
            className={`${sizeClasses[size]} text-yellow-400 transition-colors duration-200`}
          />
        ) : fillType === 'half' ? (
          <div className="relative">
            <Star 
              className={`${sizeClasses[size]} text-gray-300 transition-colors duration-200`}
            />
            <div 
              className="absolute inset-0 overflow-hidden" 
              style={{ width: '50%' }}
            >
              <StarSolid 
                className={`${sizeClasses[size]} text-yellow-400 transition-colors duration-200`}
              />
            </div>
          </div>
        ) : (
          <Star 
            className={`${sizeClasses[size]} text-gray-300 transition-colors duration-200 ${
              interactive ? 'hover:text-yellow-200' : ''
            }`}
          />
        )}
      </button>
    );
  });

  return (
    <div 
      className={`flex items-center gap-1 ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      {stars}
      {interactive && (
        <Typography className="ml-2 text-gray-600 min-w-[2rem]">
          {hoveredRating ?? value}/5
        </Typography>
      )}
    </div>
  );
};

// Export a controlled version for forms
export interface ControlledStarRatingProps extends Omit<StarRatingProps, 'value' | 'onChange'> {
  value: number;
  onChange: (rating: number) => void;
  name?: string;
}

export const ControlledStarRating = ({ 
  value, 
  onChange, 
  name,
  ...props 
}: ControlledStarRatingProps) => {
  return (
    <>
      <StarRating
        {...props}
        value={value}
        onChange={onChange}
        interactive={true}
      />
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
        />
      )}
    </>
  );
};
