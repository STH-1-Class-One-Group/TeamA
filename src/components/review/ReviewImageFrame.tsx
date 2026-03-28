import { useEffect, useRef, useState } from 'react';

interface ReviewImageFrameProps {
  src: string;
  alt: string;
}

export function ReviewImageFrame({ src, alt }: ReviewImageFrameProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [isTall, setIsTall] = useState(false);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateFrameSize = () => {
      if (frameRef.current) {
        setFrameSize({
          width: frameRef.current.clientWidth || 0,
          height: frameRef.current.clientHeight || 0,
        });
      }
    };

    updateFrameSize();
    window.addEventListener('resize', updateFrameSize);
    return () => {
      window.removeEventListener('resize', updateFrameSize);
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className={isTall ? 'review-card__image-frame review-card__image-frame--rotated' : 'review-card__image-frame'}
      style={{
        width: '100%',
        height: 'min(220px, 56vw)',
        maxHeight: '220px',
        borderRadius: '20px',
        overflow: 'hidden',
        background: 'rgba(255, 250, 252, 0.96)',
        border: '1px solid rgba(255, 176, 201, 0.16)',
        padding: '0',
        position: 'relative',
      }}
    >
      {isTall ? (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${Math.max(frameSize.height, 1)}px`,
            height: `${Math.max(frameSize.width, 1)}px`,
            transform: 'translate(-50%, -50%) rotate(-90deg)',
            transformOrigin: 'center center',
            overflow: 'hidden',
            borderRadius: '14px',
          }}
        >
          <img
            className="review-card__image"
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={(event) => {
              const target = event.currentTarget;
              setIsTall(target.naturalHeight > target.naturalWidth * 1.12);
              if (frameRef.current) {
                setFrameSize({
                  width: frameRef.current.clientWidth || 0,
                  height: frameRef.current.clientHeight || 0,
                });
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '14px',
              display: 'block',
              margin: 0,
            }}
          />
        </div>
      ) : (
        <img
          className="review-card__image"
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={(event) => {
            const target = event.currentTarget;
            setIsTall(target.naturalHeight > target.naturalWidth * 1.12);
            if (frameRef.current) {
              setFrameSize({
                width: frameRef.current.clientWidth || 0,
                height: frameRef.current.clientHeight || 0,
              });
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '14px',
            display: 'block',
            margin: 0,
          }}
        />
      )}
    </div>
  );
}
