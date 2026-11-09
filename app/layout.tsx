import './globals.css';
import type { Metadata } from 'next';
export const metadata:Metadata={title:'Sandhu Electronics | Business Management',description:'Customer, inventory and business operations for Sandhu Electronics.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
