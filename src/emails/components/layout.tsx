import { Body, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import type { ReactNode } from 'react';

interface LayoutProps {
  previewText?: string;
  businessName?: string;
  children: ReactNode;
}

export function Layout({ previewText, businessName, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body
        style={{
          backgroundColor: '#e4e4e7',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          margin: '0',
          padding: '24px 0',
        }}
      >
        <Container
          style={{
            maxWidth: '480px',
            margin: '0 auto',
          }}
        >
          {/* Card principal */}
          <Section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            {/* Gradient Header */}
            <Section
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
                padding: '36px 24px 28px',
                textAlign: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  margin: '0 0 2px',
                  letterSpacing: '-0.3px',
                }}
              >
                Store Lite
              </Text>
              {businessName && (
                <Text
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.8)',
                    margin: '0',
                  }}
                >
                  {businessName}
                </Text>
              )}
            </Section>

            {/* Content */}
            <Section style={{ padding: '28px 24px' }}>{children}</Section>
          </Section>

          {/* Footer */}
          <Section style={{ padding: '16px 24px 0' }}>
            <Text
              style={{
                fontSize: '11px',
                color: '#a1a1aa',
                textAlign: 'center',
                lineHeight: '16px',
                margin: '0 0 4px',
              }}
            >
              © 2026 Store Lite. Todos los derechos reservados.
            </Text>
            <Text
              style={{
                fontSize: '10px',
                color: '#a1a1aa',
                textAlign: 'center',
                lineHeight: '14px',
                margin: '0',
              }}
            >
              Este mensaje se envió desde una dirección de correo electrónico que solo envía
              notificaciones y no acepta correos electrónicos entrantes. Por favor, no respondas a
              este mensaje.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
