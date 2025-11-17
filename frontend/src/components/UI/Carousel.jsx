import React, { useEffect, useCallback, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";

const Carousel = ({
  children,
  className = "",
  autoPlay = true,
  autoPlayInterval = 4000,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    dragFree: true,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const autoplayRef = useRef(null);
  const childCount = React.Children.count(children);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback((emblaApi) => {
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("reInit", onSelect);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || !emblaApi) return;

    const play = () => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    };

    autoplayRef.current = setInterval(play, autoPlayInterval);

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [emblaApi, autoPlay, autoPlayInterval]);

  // Pause on hover (desktop only, not on touch)
  const handleMouseEnter = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!autoPlay || !emblaApi) return;
    const play = () => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    };
    autoplayRef.current = setInterval(play, autoPlayInterval);
  }, [emblaApi, autoPlay, autoPlayInterval]);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {React.Children.map(children, (child, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 px-1 sm:px-2">
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Subtle Navigation Buttons - Only visible on hover/interaction */}
      <div className="absolute inset-0 pointer-events-none">
        <button
          onClick={scrollPrev}
          onTouchStart={scrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 opacity-0 hover:opacity-100 active:opacity-100 rounded-full bg-black/40 backdrop-blur-sm border border-purple-500/20 flex items-center justify-center transition-all duration-300 pointer-events-auto touch-manipulation"
          aria-label="Previous slide"
        >
          <svg
            className="w-3.5 h-3.5 text-purple-400/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={scrollNext}
          onTouchStart={scrollNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 opacity-0 hover:opacity-100 active:opacity-100 rounded-full bg-black/40 backdrop-blur-sm border border-purple-500/20 flex items-center justify-center transition-all duration-300 pointer-events-auto touch-manipulation"
          aria-label="Next slide"
        >
          <svg
            className="w-3.5 h-3.5 text-purple-400/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Dot Indicators - Circular Dots */}
      {childCount > 1 && (
        <div className="flex justify-center items-center gap-2.5 mt-4">
          {Array.from({ length: childCount }).map((_, index) => {
            const isActive = index === selectedIndex;
            return (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`
                  rounded-full shrink-0 border-none outline-none
                  transition-all duration-150 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent
                  flex items-center justify-center
                  ${
                    isActive
                      ? "w-4 h-4 bg-[#B24BFF] scale-[1.2]"
                      : "w-2.5 h-2.5 bg-purple-500/35 border border-purple-500/40"
                  }
                `}
                style={{
                  minWidth: "12px",
                  minHeight: "12px",
                }}
                aria-label={`Slide ${index + 1}`}
                aria-current={isActive ? "true" : "false"}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CarouselContent = ({ children, className = "" }) => {
  return <div className={className}>{children}</div>;
};

export const CarouselItem = ({ children, className = "" }) => {
  return <div className={className}>{children}</div>;
};

export default Carousel;
