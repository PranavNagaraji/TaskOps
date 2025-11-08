import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import Navbar from "./components/Navbar";
import MapsProvider from "./components/MapsProvider";

export const metadata = {
  title: "Service Management System",
  description: "Frontend for Service Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <MapsProvider>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </MapsProvider>
      </body>
    </html>
  );
}