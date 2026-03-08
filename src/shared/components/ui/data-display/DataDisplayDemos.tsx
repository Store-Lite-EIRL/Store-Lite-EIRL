'use client';

import { Carousel } from './Carousel';

export const DataDisplayDemos = () => {
  // Only 5 items with Material Design 3 default colors
  const demoItems = [
    { label: 'Estado 1', bgColor: 'primary', textColor: 'on-primary' },
    { label: 'Estado 2', bgColor: 'secondary', textColor: 'on-secondary' },
    { label: 'Estado 3', bgColor: 'tertiary', textColor: 'on-tertiary' },
    { label: 'Estado 4', bgColor: 'error', textColor: 'on-error' },
    { label: 'Estado 5', bgColor: 'surface-variant', textColor: 'on-surface-variant' },
  ];

  return (
    <div style={{ padding: '32px 0' }}>
      <Carousel>
        {demoItems.map((item, i) => (
          <div
            key={i}
            className="carousel-demo-card"
            style={{
              backgroundColor: `var(--md-sys-color-${item.bgColor})`,
              color: `var(--md-sys-color-${item.textColor})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              borderRadius: '16px',
              width: '100%',
              height: '100%',
            }}
          >
            {item.label}
          </div>
        ))}
      </Carousel>
    </div>
  );
};
