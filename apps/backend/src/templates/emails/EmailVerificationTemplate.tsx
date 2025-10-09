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

    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={logo}>NEXGEN</Heading>
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

const codeContainer = {
    background: 'linear-gradient(135deg, #D4AF37 0%, #C9A02C 100%)',
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
    backgroundColor: '#e7f3ff',
    borderLeft: '4px solid #2196F3',
    padding: '15px',
    margin: '20px 0',
    borderRadius: '4px',
};

const infoText = {
    margin: '0',
    fontSize: '14px',
    color: '#2196F3',
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

export default EmailVerificationTemplate;