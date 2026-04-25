import './globals.css';

export const metadata = {
    title: 'Msgora Admin',
    description: 'License Management Panel',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
