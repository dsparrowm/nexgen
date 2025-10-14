import React from 'react';
// no local image dependency for emails; using styled text logo instead
import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Button,
    Heading,
    Hr,
} from '@react-email/components';

interface EmailVerificationTemplateProps {
    userName?: string;
    verificationCode: string;
    frontendUrl?: string;
}

export const EmailVerificationTemplate: React.FC<EmailVerificationTemplateProps> = ({
    userName,
    verificationCode,
    frontendUrl = 'https://nexgencrypto.live',
}) => {
    const verificationUrl = `${frontendUrl}/verify-email`;

    // Use a styled text wordmark for the logo so emails don't depend on external
    // image assets (improves deliverability and avoids broken images).

    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    <Section style={headerRow}>
                        <div style={logoWrapper}>
                            <div style={wordLogo}>
                                <span style={logoPart1}>Nex</span>
                                <span style={logoPart2}>Gen</span>
                            </div>
                        </div>
                        <div style={{ flex: 1 }} />
                    </Section>

                    <Heading style={h1}>Welcome to NexGen!</Heading>

                    <Text style={text}>
                        Hi{userName ? ` ${userName}` : ''},
                    </Text>

                    <Text style={text}>
                        Thank you for signing up! Please verify your email address using the code below:
                    </Text>

                    <Section style={codeContainer}>
                        <Text style={code}>{verificationCode}</Text>
                    </Section>

                    <Section style={infoBox}>
                        <Text style={infoText}>
                            Enter this code on the verification page to activate your account.
                        </Text>
                    </Section>

                    <Section style={buttonContainer}>
                        <Button style={button} href={verificationUrl}>
                            Verify Email Address
                        </Button>
                    </Section>

                    <Text style={text}>
                        If you didn't create an account with NexGen, you can safely ignore this email.
                    </Text>

                    <Hr style={hr} />

                    <Section style={footer}>
                        <Text style={footerText}>
                            <strong>NexGen Cloud Mining Platform</strong>
                        </Text>
                        <Text style={footerText}>
                            This is an automated email, please do not reply.
                        </Text>
                        <Text style={footerText}>
                            Need help? Contact us at{' '}
                            <a href="mailto:support@nexgencrypto.live" style={link}>
                                support@nexgencrypto.live
                            </a>
                        </Text>
                        <Text style={footerText}>
                            <a href="https://nexgencrypto.live" style={link}>
                                Visit our website
                            </a>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Using the project's Tailwind palette colors directly so emails match the landing page
// gold.500: #FFD700, navy.800: #243B53, navy.900: #0A2540, dark.800: #1E293B
const main = {
    backgroundColor: '#0A2540', // navy.900 - match landing page
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    lineHeight: '1.6',
    color: '#FFFFFF', // white text on dark background
};

const container = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '28px',
    backgroundColor: 'transparent', // transparent so navy background shows through
    borderRadius: '0',
};

const header = {
    textAlign: 'center' as const,
    marginBottom: '30px',
};

const headerRow = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '12px',
    marginBottom: '20px',
} as const;

const logoWrapper = {
    display: 'flex',
    alignItems: 'center',
} as const;

const logoImg = {
    width: '72px',
    height: 'auto',
    display: 'block',
} as const;

const logo = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#D4AF37',
    margin: '0',
};

/* wordmark styles defined later to use the canonical brand palette */

const h1 = {
    color: '#FFFFFF',
    fontSize: '24px',
    marginBottom: '20px',
    textAlign: 'center' as const,
};

const text = {
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '20px',
};

const codeContainer = {
    background: 'linear-gradient(135deg, #FFD700 0%, #E6C200 100%)', // gold gradient
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    margin: '30px 0',
};

const code = {
    color: 'white',
    fontSize: '36px',
    fontWeight: 'bold',
    letterSpacing: '10px',
    margin: '0',
    fontFamily: 'monospace',
};

const infoBox = {
    backgroundColor: '#243B53', // navy.800
    borderLeft: '4px solid #FFD700', // gold.500 accent
    padding: '15px',
    margin: '20px 0',
    borderRadius: '4px',
};

const infoText = {
    margin: '0',
    fontSize: '14px',
    color: '#E6F2FF', // light text for info
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '30px 0',
};

const button = {
    background: 'linear-gradient(135deg, #FFD700 0%, #E6C200 100%)', // gold gradient
    color: '#0A2540', // dark text on gold button for contrast
    padding: '14px 30px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    display: 'inline-block',
};

const hr = {
    border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    margin: '30px 0',
};

const footer = {
    textAlign: 'center' as const,
};

const footerText = {
    fontSize: '12px',
    color: '#94A3B8', // muted light text
    margin: '5px 0',
};

const link = {
    color: '#FFD700', // gold.500
    textDecoration: 'none',
};

// Wordmark logo parts use brand colors
const wordLogo = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontWeight: '700',
    fontSize: '24px',
}

const logoPart1 = {
    color: '#FFFFFF', // white part of the wordmark
}

const logoPart2 = {
    color: '#FFD700', // gold accent
}

export default EmailVerificationTemplate;