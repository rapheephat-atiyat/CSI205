import Footer from "@/components/layout/Footer";
import Navabr from "@/components/layout/Navabr";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navabr />
            {children}
            <Footer />
        </>
    );
}