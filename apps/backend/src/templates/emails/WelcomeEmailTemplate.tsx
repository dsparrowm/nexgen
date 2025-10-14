import React from 'react';
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

interface WelcomeEmailTemplateProps {
    userName: string;
    loginUrl?: string;
}

export const WelcomeEmailTemplate: React.FC<WelcomeEmailTemplateProps> = ({
    userName,
    loginUrl = 'https://nexgencrypto.live/login',
}) => {
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

                    <Heading style={h1}>Welcome to NexGen! 🎉</Heading>

                    <Text style={text}>
                        Hi {userName},
                    </Text>

                    <Text style={text}>
                        Congratulations! Your email has been successfully verified and your account is now active.
                    </Text>

                    <Text style={text}>
                        You can now start your cloud mining journey with NexGen. Here's what you can do:
                    </Text>

                    <Section style={featuresList}>
                        <Text style={feature}>
                            🚀 <strong>Start Mining:</strong> Choose from our various mining packages
                        </Text>
                        <Text style={feature}>
                            💰 <strong>Earn Daily:</strong> Receive automatic payouts to your account
                        </Text>
                        <Text style={feature}>
                            📊 <strong>Track Progress:</strong> Monitor your mining performance in real-time
                        </Text>
                        <Text style={feature}>
                            👥 <strong>Referral Program:</strong> Earn bonuses by referring friends
                        </Text>
                    </Section>

                    <Section style={buttonContainer}>
                        <Button style={button} href={loginUrl}>
                            Start Mining Now
                        </Button>
                    </Section>

                    <Section style={securityBox}>
                        <Text style={securityText}>
                            <strong>🔒 Security Reminder:</strong> Always keep your account credentials secure and enable two-factor authentication for additional protection.
                        </Text>
                    </Section>

                    <Text style={text}>
                        If you have any questions, our support team is here to help you get started.
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

// Dark theme to match landing page
const main = {
    backgroundColor: '#0A2540', // navy.900
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    lineHeight: '1.6',
    color: '#FFFFFF',
};

const container = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: 'transparent',
    borderRadius: '0',
};

const header = {
    textAlign: 'center' as const,
    marginBottom: '30px',
};

const logo = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#FFD700',
    margin: '0',
};

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

const featuresList = {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
};

const feature = {
    margin: '10px 0',
    fontSize: '14px',
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '30px 0',
};

const button = {
    background: 'linear-gradient(135deg, #FFD700 0%, #E6C200 100%)',
    color: '#0A2540',
    padding: '14px 30px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    display: 'inline-block',
};

const securityBox = {
    backgroundColor: '#243B53', // navy.800
    borderLeft: '4px solid #FFD700',
    padding: '15px',
    margin: '20px 0',
    borderRadius: '4px',
};

const securityText = {
    margin: '0',
    fontSize: '14px',
    color: '#E6F2FF',
};

const hr = {
    border: 'none',
    borderTop: '1px solid #eee',
    margin: '30px 0',
};

const footer = {
    textAlign: 'center' as const,
};

const footerText = {
    fontSize: '12px',
    color: '#94A3B8',
    margin: '5px 0',
};

const link = {
    color: '#FFD700',
    textDecoration: 'none',
};

// Reuse same wordmark styles used by verification template
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

const wordLogo = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontWeight: '700',
    fontSize: '24px',
}

const logoPart1 = {
    color: '#FFFFFF',
}

const logoPart2 = {
    color: '#FFD700',
}

const transparentContainer = {
    backgroundColor: 'transparent',
}

const darkThemeText = {
    color: '#FFFFFF',
}

export default WelcomeEmailTemplate;