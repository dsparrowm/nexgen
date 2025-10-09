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
                    <Section style={header}>
                        <Heading style={logo}>NEXGEN</Heading>
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

const main = {
    backgroundColor: '#f4f4f4',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    lineHeight: '1.6',
    color: '#333',
};

const container = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
};

const header = {
    textAlign: 'center' as const,
    marginBottom: '30px',
};

const logo = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#D4AF37',
    margin: '0',
};

const h1 = {
    color: '#1a1a2e',
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
    backgroundColor: '#f8f9fa',
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
    background: 'linear-gradient(135deg, #D4AF37 0%, #C9A02C 100%)',
    color: 'white',
    padding: '14px 30px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
    display: 'inline-block',
};

const securityBox = {
    backgroundColor: '#fff3cd',
    borderLeft: '4px solid #ffc107',
    padding: '15px',
    margin: '20px 0',
    borderRadius: '4px',
};

const securityText = {
    margin: '0',
    fontSize: '14px',
    color: '#856404',
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
    color: '#777',
    margin: '5px 0',
};

const link = {
    color: '#D4AF37',
    textDecoration: 'none',
};

export default WelcomeEmailTemplate;